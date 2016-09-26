var amqp = require('amqplib/callback_api');

var amqpConn = null;
function start() {
  amqp.connect("amqp://kicgmglo:b-Oo-rirAvxrmUVPXtTXjCcpmrTHh3Hn@reindeer.rmq.cloudamqp.com/kicgmglo?heartbeat=60", function(err, conn) {
    if (err) {
      console.error("[RABBIT]", err.message);
      return setTimeout(start, 1000);
    }
    conn.on("error", function(err) {
      if (err.message !== "Cerrando") {
        console.error("[RABBIT] error de conexion", err.message);
      }
    });
    conn.on("close", function() {
      console.error("[RABBIT] reconectar");
      return setTimeout(start, 1000);
    });

    console.log("[RABBIT] conectada");
    amqpConn = conn;

    whenConnected();
  });
}

function whenConnected() {
  startPublisher();
  startWorker();
}

var pubChannel = null;
var offlinePubQueue = [];
function startPublisher() {
  amqpConn.createConfirmChannel(function(err, ch) {
    if (closeOnErr(err)) return;
    ch.on("error", function(err) {
      console.error("[RABBIT] error en canal", err.message);
    });
    ch.on("close", function() {
      console.log("[RABBIT] canal cerrado");
    });

    pubChannel = ch;
  });
}

function publish(exchange, routingKey, content) {
  try {
    pubChannel.publish(exchange, routingKey, content, { persistent: true },
                       function(err, ok) {
                         if (err) {
                           console.error("[RABBIT] publicar", err);
                           offlinePubQueue.push([exchange, routingKey, content]);
                           pubChannel.connection.close();
                         }
                       });
  } catch (e) {
    console.error("[RABBIT] publicar", e.message);
    offlinePubQueue.push([exchange, routingKey, content]);
  }
}

function startWorker() {
  amqpConn.createChannel(function(err, ch) {
    if (closeOnErr(err)) return;
    ch.on("error", function(err) {
      console.error("[RABBIT] error en canal", err.message);
    });
    ch.on("close", function() {
      console.log("[RABBIT] canal cerrado");
    });
    ch.prefetch(10);
    ch.assertQueue("coladefault", { durable: true }, function(err, _ok) {
      if (closeOnErr(err)) return;
      ch.consume("coladefault", processMsg, { noAck: false });
      console.log("Cola iniciada");
    });

    function processMsg(msg) {
      work(msg, function(ok) {
        try {
          if (ok)
            ch.ack(msg);
          else
            ch.reject(msg, true);
        } catch (e) {
          closeOnErr(e);
        }
      });
    }
  });
}

function work(msg, cb) {
  console.log("Got msg", msg.content.toString());
  cb(true);
}

function closeOnErr(err) {
  if (!err) return false;
  console.error("[RABBIT] error", err);
  amqpConn.close();
  return true;
}

var http = require('http');
const PORT=8080; 
function handleRequest(request, response){
	var url = require('url');
	var url_parts = url.parse(request.url, true);
	if (url_parts.query.length > 0) {
	    publish("", "coladefault", new Buffer(JSON.stringify(url_parts.query)));
		response.end('Publicando ' + url_parts.query.funcion);
	} else {
		response.end('No se definio la funcion a invocar');
	}
}
var server = http.createServer(handleRequest);
server.listen(PORT, function(){
    console.log("Server listening on: http://localhost:%s", PORT);
});


start();