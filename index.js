require('dotenv').config()
const express = require('express')
const cors = require('cors'); //cors() habilita que peticiones externas

const app = express()
const port = 3000

app.use(cors());            
app.use(express.json());

app.use(express.json())

const userRouter = require('./routes/usuarios.routes')
app.use('/usuarios', userRouter)

const userRouterProduct = require('./routes/productos.routes')
app.use('/productos', userRouterProduct)

const ventaRouter = require('./routes/ventas.routes')
app.use('/ventas', ventaRouter)

const authRouter = require('./routes/auth.routes')
app.use('/auth', authRouter)

app.listen(port, () =>{
    console.log(`servidor corriendo en el localhost:${port}`)
})