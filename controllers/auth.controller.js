const bcrypt= require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

//registrar nuevo usuario
const register = async (req, res) => {
        
    const { nombre, email, edad, contrasenia, role} = req.body;                
    
    try {
        const userExist = await Usuario.findOne({
            where: {
                email
            }
        });

        if (userExist) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const hashContrasenia = await bcrypt.hash(contrasenia, 10);
        const user = await Usuario.create({
            nombre,
            email,
            edad,
            contrasenia: hashContrasenia,
            role: role || 'cliente'
        })

        res.status(201).json({ message: 'Usuario creado exitosamente', data: user });
    } catch (error) {
        console.error('Error al crear usuario :', error);
        res.status(500).json({
            message: error.message || 'Error interno del servidor'
        });
        
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Busca usuario en DB
        const userExist = await Usuario.findOne({ where: { email } });
        if (!userExist) {
            return res.status(404).json({ message: 'El usuario no existe' });
        }

        // Valida contraseña
        const isPasswordValid = await bcrypt.compare(password, userExist.contrasenia);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        // Prepara datos del usuario para enviar (sin contraseña)
        const user = {
            id: userExist.id,
            nombre: userExist.nombre,
            email: userExist.email,
            edad: userExist.edad,
            role: userExist.role
        };

        // Genera token usando datos de userExist
        const token = jwt.sign(
            { user: user },
            'secreto1234',
            { expiresIn: '1h' }
        );

        res.json({ message: 'Inicio de sesion exitoso', token })

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({
            message: error.message || 'Error interno del servidor'
        }); 
    }
};

module.exports = { register, login };