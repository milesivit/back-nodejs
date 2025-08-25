const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if(!authHeader){
        return res.status(403).json({message: 'Token requerido'});
    }
    
    const [scheme, token] = authHeader.split(' ')

    if(scheme !== 'Bearer' || !token) {
        return res.status(401).json({message: 'Formato invalido'})
    }

    try{
       const decodeToken = jwt.verify(token, 'secreto1234');
       req.user = decodeToken
       next();
    } catch (error) {
        return res.status(401).json({message: 'Token invalido o expirado'})
    }

}

module.exports = {
    verifyToken
}