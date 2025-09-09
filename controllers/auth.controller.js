const bcrypt= require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const crypto = require('crypto');
const {sendEmail} = require('../utils/nodemailer')

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

const resetTokens = new Map()

const resetEmailTemplate = ({nombre, resetUrl}) =>{
    return `
        <div style="max-width:520px; margin:0; padding:20px;">
            <h2>Recupera tu contrasenia</h2>
            <p>Hola ${nombre || ''}, recibimos tu solucitud para restablecer la contrasenia.</p>
            <p>Hace click en el boton para continuar.</p>
            <p>
                <a href=${resetUrl}>
                    Cambiar contrasenia
                </a>
            </p>
            <p>Si no fuiste vos, podes ignorar este mensaje.</p>
        </div>
    `
}

const forgotPassword = async (req,res) =>{
    const {email} = req.body
    try {
        const user = await Usuario.findOne({ where: {email} })
        if (!user) {
            return res.status(404).json({ message: 'El usuario no existe' });
        }        
        const rawToken = crypto.randomBytes(32).toString('hex')
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
        const expiresAt = Date.now() + 15 * 60 * 1000

        resetTokens.set(user.id, {tokenHash, expiresAt})

        const resetUrl = `${process.env.FRONT_URL || 'http://localhost:5173'}/recuperar-contrasenia?token=${rawToken}&id=${user.id}`
        
        console.log('Antes de enviar mail')
        await sendEmail({
            to: user.email,
            subject: 'recuperar contraseña',
            html: resetEmailTemplate({nombre: user.nombre, resetUrl})
        })
        console.log('Después de enviar mail')
        
        return res.status(201).json({message: 'email enviado correctamente'})

    } catch (error) {
        return res.status(500).json({message:'Error al enviar el mail', error: error.message})
    }
}

const resetPassword = async(req,res) =>{
    const {id, token, password} = req.body

    if(!id || !token || !password) return res.status(400).json({message: 'Faltan datos'})
    
    try {
        const entry = resetTokens.get(Number(id))
        if(!entry) return res.status(400).json({ message: 'Token invalido'})
        
        if(entry.expiresAt < Date.now()){
            return res.status(400).json({ message: 'Token expirado'})
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

        if(tokenHash !== entry.tokenHash) return res.status(400).json({ message: 'Token invalido'})
        
        const user = await Usuario.findByPk(id)
        if(!user) return res.status(400).json({ message: 'El usuario no existe'})

        user.contrasenia = await bcrypt.hash(password, 10)
        await user.save()

        resetTokens.delete(Number(id))
        return res.status(201).json({message: 'Contrasenia actualizada exitosamente'})
    } catch (error) {
        return res.status(500).json({message:'Error al enviar el mail', error: error.message})
    }

}
 
module.exports = { register, login, forgotPassword, resetPassword };