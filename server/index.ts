import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.backend' });

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

// Log de seguridad (solo desarrollo)
console.log('--- Server Status ---');
console.log('ADMIN_API_KEY cargada:', !!process.env.ADMIN_API_KEY);
console.log('PORT:', PORT);
console.log('---------------------');

app.use(cors());
app.use(express.json());

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
        const { name, email, attending, guests, dietary, message, cedulas } = req.body;

        const guestCount = parseInt(guests.split(' ')[0]) || 1;
        const isAttending = attending === 'yes';

        const result = await prisma.rSVP.create({
            data: {
                name,
                email,
                attending: isAttending,
                guestsCount: isAttending ? guestCount : 0,
                dietary: dietary || null,
                message: message || null,
                cedulas: JSON.stringify(cedulas || [])
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
                            <li>Fecha: 11 de Octubre, 2026</li>
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

// 2. POST Song Suggestion
app.post('/api/songs', async (req, res) => {
    try {
        const { song } = req.body;
        if (!song) return res.status(400).json({ error: 'Song is required' });

        const result = await prisma.songSuggestion.create({
            data: { song }
        });

        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Song Error:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// 3. GET Admin Summary
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

// 4. GET All Guests
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
