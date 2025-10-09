const { json } = require('express')
const fs = require('fs')
const path = require('path')
const filePath = path.join(__dirname, '../data/productos.json')
const { Op } = require('sequelize')

const { Producto } = require('../models');

const leerProductos = () => {
    const data = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(data);
}

const escribirProductos = (productos) =>{
    fs.writeFileSync(filePath, JSON.stringify(productos, null, 2))
}

const getProducts = async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
      const q = (req.query.q || '').trim()
      const where = q ? {nombre:{[Op.like]: `%${q}%`}} : {}
      const offset = (page-1)*limit
      const {rows, count} = await Producto.findAndCountAll({
        where,
        offset,
        limit,
        order: [['id', 'DESC']]
      })
      return res.json({
        data: rows,
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        status: 200,
        message: 'productos obtenidos de manera exitosa'
      })
    } catch (error) {
      console.error('Error al obtener productos:', error);
      res.status(500).json({
        message: error.message || 'Error interno del servidor'
      });
    }
  };
  
  const getProductById = async (req, res) =>{
    try {
        const producto = await Producto.findByPk(req.params.id)
        if (!producto) {
            return res.status(404).json({ message: 'producto no encontrado'})
        } else {
            res.json({data: producto, status: 200, message: 'producto encontrado' })
        }
    } catch (error) {
        console.error('Error al obtener producto id:', error);
        res.status(500).json({
          message: error.message || 'Error interno del servidor'
        });
    }
  }

  const createProduct = async (req, res) => {
    const {nombre, precio} = req.body

    try {
        if (!nombre || !precio) {
                return res.status(400).json({ message: 'faltan datos obligatorios'})
        }
        const nuevoProducto = await Producto.create({nombre, precio})
        res.status(201).json({message: 'producto creado satisfactoriamente', data: nuevoProducto })
    } catch (error) {
        console.error('Error al crear producto :', error);
        res.status(500).json({
          message: error.message || 'Error interno del servidor'
        });
    }
  }

  const updateProduct = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) {
            return res.status(404).json({ status: 404, message: 'Producto no encontrado' });
        }

        const { nombre, precio } = req.body;

        producto.nombre = nombre || producto.nombre;
        producto.precio = precio || producto.precio;

        await producto.save();

        res.status(200).json({ status: 200, message: 'Producto editado exitosamente', data: producto });
    } catch (error) {
        res.status(500).json({ status: 500, message: 'Error al editar producto', error: error.message });
    }
};

const deleteProduct = async (req, res) => {
  try {
      const producto = await Producto.findByPk(req.params.id);
      if (!producto) {
          return res.status(404).json({ status: 404, message: 'Producto no encontrado' });
      }

      await producto.destroy();

      res.status(200).json({ status: 200, message: 'Producto eliminado exitosamente' });
  } catch (error) {
      res.status(500).json({ status: 500, message: 'Error al eliminar producto', error: error.message });
  }
};

module.exports = {
    getProducts,
    getProductById,
    deleteProduct,
    createProduct,
    updateProduct
}
