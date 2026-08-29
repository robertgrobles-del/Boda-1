import app from '../api/index';
import dotenv from 'dotenv';

// Cargar variables de entorno del backend en desarrollo local
dotenv.config({ path: './.env.backend' });

const PORT = process.env.PORT || 3001;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
