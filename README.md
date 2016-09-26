###Instalar
npm install amqplib

###Ejecutar
node rabbit.js

###Desde navegador enviar lo que se desea encolar:
http://127.0.0.1:8080/?funcion=pago&params=[1,2,3]

--
La intención es mostrar un funcionamiento básico de encolamiento de mensajes, haciendo un hub que concentre cada petición destinada a ejecutar cierta funcion y que será atendida con el encolamiento de RabbitMQ, desde una instancia montada en https://www.cloudamqp.com

**Happy coding!**
- [ivan miranda](http://ivanmiranda.me)