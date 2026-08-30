import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Cargar variables de entorno del backend
dotenv.config({ path: './.env.backend' });

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuración de Nodemailer (Placeholder - requiere config del usuario)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- ROUTES ---

// 1. POST RSVP
app.post('/api/rsvp', async (req, res) => {
    try {
        const { name, email, phone, pin, attending, guests, dietary, message, cedulas } = req.body;

        if (!phone || !pin) {
            return res.status(400).json({ success: false, error: 'Se requiere teléfono y PIN para confirmar.' });
        }

        // Buscar si el teléfono está invitado
        const allowed = await prisma.allowedGuest.findUnique({
            where: { phone }
        });

        if (!allowed) {
            return res.status(403).json({ success: false, error: 'Este número de teléfono no está en la lista de invitados.' });
        }

        if (allowed.pin !== pin) {
            return res.status(403).json({ success: false, error: 'El PIN ingresado es incorrecto.' });
        }

        if (allowed.used) {
            return res.status(403).json({ success: false, error: 'Este PIN ya ha sido utilizado para confirmar asistencia.' });
        }

        const guestCount = parseInt(guests.split(' ')[0]) || 1;
        const isAttending = attending === 'yes';

        // Validar límite de invitados permitido
        const maxAllowed = (allowed as any).maxGuests || 2;
        if (isAttending && guestCount > maxAllowed) {
            return res.status(400).json({ 
                success: false, 
                error: `La cantidad máxima permitida para tu invitación es de ${maxAllowed} persona(s).` 
            });
        }

        const result = await prisma.rSVP.create({
            data: {
                name,
                email,
                phone,
                attending: isAttending,
                guestsCount: isAttending ? guestCount : 0,
                dietary: dietary || null,
                message: message || null,
                cedulas: JSON.stringify(cedulas || [])
            }
        });

        // Marcar PIN como usado
        await prisma.allowedGuest.update({
            where: { phone },
            data: {
                used: true,
                usedAt: new Date()
            }
        });

        // Enviar Email de Confirmación
        if (isAttending && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: '¡Confirmación recibida! - Boda Stephanie & Daniel',
                html: `
                    <div style="font-family: serif; padding: 20px; color: #4a5d23;">
                        <h1>¡Hola ${name}!</h1>
                        <p>Hemos recibido tu confirmación para nuestra boda. ¡Estamos muy felices de que nos acompañes!</p>
                        <hr />
                        <p><strong>Detalles:</strong></p>
                        <ul>
                            <li>Invitados: ${guestCount}</li>
                            <li>Fecha: 7 de Noviembre de 2026</li>
                        </ul>
                        <p>Nos vemos pronto,</p>
                        <p><em>Stephanie & Daniel</em></p>
                    </div>
                `
            };
            transporter.sendMail(mailOptions).catch(err => console.error('Email error:', err));
        }

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('RSVP Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

let cachedToken = '';
let tokenExpiry = 0; // Timestamp en ms

// Helper to sign JWT using RS256 (Native crypto)
const getGoogleAccessToken = async (serviceAccount: any): Promise<string> => {
    if (cachedToken && Date.now() < tokenExpiry) {
        return cachedToken;
    }

    const crypto = await import('crypto');
    const header = JSON.stringify({ alg: 'RS256', typ: 'JWT' });
    const payload = JSON.stringify({
        iss: serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/drive',
        aud: 'https://oauth2.googleapis.com/token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
    });

    const base64Header = Buffer.from(header).toString('base64url');
    const base64Payload = Buffer.from(payload).toString('base64url');
    const signatureInput = `${base64Header}.${base64Payload}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');

    const jwt = `${signatureInput}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt
        })
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to get Google Access Token: ${text}`);
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + 3500 * 1000; // Guardar caché por ~58 minutos
    return cachedToken;
};

// Helper to find or create subfolder inside Google Drive
const getOrCreateSubfolder = async (accessToken: string, parentId: string, folderName: string): Promise<string> => {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    )}`;
    
    const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
            return searchData.files[0].id;
        }
    }
    
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        })
    });
    
    if (!createRes.ok) {
        throw new Error('Failed to create subfolder');
    }
    
    const createData = await createRes.json();
    return createData.id;
};

// 1.5 POST Upload Photo/Video
app.post('/api/upload', async (req, res) => {
    try {
        const { name, type, base64, folder } = req.body;
        if (!name || !base64) {
            return res.status(400).json({ error: 'Name and base64 data are required' });
        }

        const buffer = Buffer.from(base64.split(',')[1] || base64, 'base64');
        const googleServiceAccountStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
        const mainFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

        if (googleServiceAccountStr && mainFolderId) {
            const serviceAccount = JSON.parse(googleServiceAccountStr);
            const accessToken = await getGoogleAccessToken(serviceAccount);
            
            // Resolve correct folder ID (main or subfolder)
            let targetFolderId = mainFolderId;
            if (folder) {
                targetFolderId = await getOrCreateSubfolder(accessToken, mainFolderId, folder);
            }

            const boundary = '-------314159265358979323846';
            const delimiter = `\r\n--${boundary}\r\n`;
            const closeDelimiter = `\r\n--${boundary}--`;

            const metadata = {
                name: `${Date.now()}_${name}`,
                parents: [targetFolderId]
            };

            const partHeader = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`;
            const mediaPartHeader = `\r\n--${boundary}\r\nContent-Type: ${type || 'image/jpeg'}\r\n\r\n`;
            
            const bodyPayload = Buffer.concat([
                Buffer.from(partHeader),
                Buffer.from(mediaPartHeader),
                buffer,
                Buffer.from(closeDelimiter)
            ]);

            const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': `multipart/related; boundary=${boundary}`
                },
                body: bodyPayload
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('Google Drive upload error:', errText);
                throw new Error('Failed to upload to Google Drive');
            }

            const data = await response.json();
            return res.status(201).json({ success: true, fileId: data.id });
        } else {
            // Fallback to local storage (for development)
            const uploadDir = path.join(process.cwd(), 'public', 'images', 'preboda', folder || '');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const fileName = `${Date.now()}_${name}`;
            const filePath = path.join(uploadDir, fileName);
            fs.writeFileSync(filePath, buffer);

            const relativePath = folder ? `/images/preboda/${folder}/${fileName}` : `/images/preboda/${fileName}`;
            return res.status(201).json({ success: true, url: relativePath });
        }
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// 2.5 Guestbook — Libro de mensajes para los novios
app.post('/api/messages', async (req, res) => {
    try {
        const { name, message, honeypot } = req.body;

        if (honeypot) {
            // Bot: responde OK sin guardar nada
            return res.status(201).json({ success: true });
        }

        const cleanName = String(name || '').trim().slice(0, 60);
        const cleanMessage = String(message || '').trim().slice(0, 600);

        if (!cleanName || cleanMessage.length < 2) {
            return res.status(400).json({ success: false, error: 'Escribe tu nombre y un mensaje.' });
        }

        const result = await prisma.guestMessage.create({
            data: { name: cleanName, message: cleanMessage }
        });

        res.status(201).json({ success: true, data: { id: result.id, name: result.name, message: result.message, createdAt: result.createdAt } });
    } catch (error) {
        console.error('Guestbook Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// 3. GET Attendance Summary (Admin only)
app.get('/api/admin/summary', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || apiKey !== adminKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const rsvps = await prisma.rSVP.findMany();

        const summary = {
            totalRSVPs: rsvps.length,
            accepted: rsvps.filter(r => r.attending).length,
            declined: rsvps.filter(r => !r.attending).length,
            totalGuests: rsvps.reduce((acc, curr) => acc + curr.guestsCount, 0),
            dietaryRestrictions: rsvps.filter(r => r.dietary).map(r => ({ name: r.name, restriction: r.dietary }))
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// 4. GET All Guests (Admin only)
app.get('/api/admin/guests', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || apiKey !== adminKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const guests = await prisma.rSVP.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(guests);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch guests' });
    }
});

// 6. GET All Allowed Guests (Admin only)
app.get('/api/admin/allowed', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || apiKey !== adminKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const allowed = await prisma.allowedGuest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(allowed);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch allowed guests' });
    }
});

// 7. POST Add Allowed Guest (Admin only)
app.post('/api/admin/allowed', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || apiKey !== adminKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { phone, pin, maxGuests } = req.body;
    if (!phone || !pin) {
        return res.status(400).json({ error: 'Phone and PIN are required' });
    }

    const count = parseInt(maxGuests, 10) || 2;

    try {
        const result = await prisma.allowedGuest.upsert({
            where: { phone },
            update: { pin, maxGuests: count, used: false, usedAt: null } as any,
            create: { phone, pin, maxGuests: count } as any
        });
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to save allowed guest' });
    }
});

// 7b. DELETE Allowed Guest (Admin only)
app.delete('/api/admin/allowed/:id', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || apiKey !== adminKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }

    try {
        await prisma.allowedGuest.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete allowed guest' });
    }
});

// 8. GET All Guestbook Messages (Admin only)
app.get('/api/admin/messages', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || apiKey !== adminKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const messages = await prisma.guestMessage.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// 9. DELETE a Guestbook Message (Admin only)
app.delete('/api/admin/messages/:id', async (req, res) => {
    const apiKey = req.headers['x-api-key'];
    const adminKey = process.env.ADMIN_API_KEY;

    if (!adminKey || apiKey !== adminKey) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
        return res.status(400).json({ error: 'Invalid id' });
    }

    try {
        await prisma.guestMessage.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
});

export default app;
