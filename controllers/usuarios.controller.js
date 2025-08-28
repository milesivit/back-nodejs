const { json } = require('express')
const fs = require('fs')
const path = require('path')
const filePath = path.join(__dirname, '../data/usuarios.json')

const { Usuario } = require('../models');

const leerUsuario = () => {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data);
}

let usuarios = leerUsuario();

const escribirUsuarios = (usuarios) =>{
    fs.writeFileSync(filePath, JSON.stringify(usuarios, null, 2))
}

const getUsers = async (req, res) => {
    try {
      const usuarios = await Usuario.findAll();
      res.json({
        data: usuarios,
        status: 200,
        message: 'usuarios obtenidos de manera exitosa'
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        message: error.message || 'Error interno del servidor'
      });
    }
  };

const getUserById = async (req, res) =>{
    try {
        const usuario = await Usuario.findByPk(req.params.id)
        if (!usuario) {
            return res.status(404).json({ message: 'usuario no encontrado'})
        } else {
            res.json({data: usuario, status: 200, message: 'usuario encontrado' })
        }
    } catch (error) {
        console.error('Error al obtener usuario id:', error);
        res.status(500).json({
          message: error.message || 'Error interno del servidor'
        });
    }
  }

  const createUser = async (req, res) => {
    const {nombre, email, edad} = req.body

    try {
        if (!nombre || !email || !edad) {
                return res.status(400).json({ message: 'faltan datos obligatorios'})
        }
        const nuevoUsuario = await Usuario.create({nombre, email, edad})
        res.status(201).json({message: 'usuario creado satisfactoriamente', data: nuevoUsuario })
    } catch (error) {
        console.error('Error al crear usuario :', error);
        res.status(500).json({
          message: error.message || 'Error interno del servidor'
        });
    }
  }

// Editar usuario
const updateUsuario = async (req, res) => {
  try {
      const usuario = await Usuario.findByPk(req.params.id);
      if (!usuario) {
          return res.status(404).json({ status: 404, message: 'Usuario no encontrado' });
      }

      const { nombre, email, edad, role } = req.body;
      usuario.nombre = nombre || usuario.nombre;
      usuario.email = email || usuario.email;
      usuario.edad = edad || usuario.edad;
      usuario.role = role || usuario.role;

      await usuario.save();

      res.status(200).json({ status: 200, message: 'Usuario editado exitosamente', data: usuario });
  } catch (error) {
      res.status(500).json({ status: 500, message: 'Error al editar usuario', error: error.message });
  }
};

// Eliminar usuario
const deleteUsuario = async (req, res) => {
  try {
      const usuario = await Usuario.findByPk(req.params.id);
      if (!usuario) {
          return res.status(404).json({ status: 404, message: 'Usuario no encontrado' });
      }

      await usuario.destroy();

      res.status(200).json({ status: 200, message: 'Usuario eliminado exitosamente' });
  } catch (error) {
      res.status(500).json({ status: 500, message: 'Error al eliminar usuario', error: error.message });
  }
};


module.exports = {
    getUsers,
    getUserById,
    createUser,
    deleteUsuario,
    updateUsuario
}
