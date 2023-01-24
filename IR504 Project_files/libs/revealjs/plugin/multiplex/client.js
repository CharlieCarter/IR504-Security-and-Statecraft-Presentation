(function() {
	console.log("client.js function running.")

	var multiplex = Reveal.getConfig().multiplex;
	var socketId = multiplex.id;
	var socket = io.connect(multiplex.url);

    // ======================== for polls
    var pollyes=0;
    var pollno=0;
    var polldone=false;
    // util fct called when receiving a poll result from other clients
    function handlepollres(isyes) {
        if (isyes==1) {
            pollyes=pollyes+1;
            if (polldone) {document.getElementById("mplexpollyes").innerHTML=""+pollyes;}
        } else {
            pollno=pollno+1;
            if (polldone) {document.getElementById("mplexpollno").innerHTML=""+pollno;}
        }
    }
    // fct called when the local user press a button to answer the poll
    function poll(isyes) {
        polldone=true;
        document.getElementById("pollbyes").disabled=true;
        document.getElementById("pollbno").disabled=true;
        handlepollres(isyes);
		var messageData = {
            cmd: 'pollres', res: isyes
        }
        socket.emit( 'mplexpoll', messageData );
    }
    window.mplexpoll = poll;
    socket.on('mplexpoll', data => {
        handlepollres(data.res);
    });
    function pollvisible(isvisible) {
            el = document.getElementById("poverlay");
            if (isvisible) el.style.visibility = "visible";
            else el.style.visibility = "hidden";
            pollyes=0; pollno=0; polldone=false;
            document.getElementById("mplexpollyes").innerHTML=""+pollyes;
            document.getElementById("mplexpollno").innerHTML=""+pollno;
            document.getElementById("pollbyes").disabled=false;
            document.getElementById("pollbno").disabled=false;
    }
    socket.on('pollactive', data => {
			console.log("poll active")
        pollvisible(true);
	});
    socket.on('pollclosed', data => {
			console.log("poll closed")
        pollvisible(false);
	});


    socket.on(multiplex.id, function(data) {

			window.dataObjectFromBroadcast = Object.assign({}, data)
			console.log(typeof(data.cmd) == 'undefined')
			console.log(typeof(data.cmd))
			if(typeof(data.cmd) == 'undefined') {
				console.log("data.cmd undefined")
				console.log(data)
				console.log(data[0])
				for(key in data) {
					console.log(key)
					console.log("key:"+String(key))
				}
				// console.log("length of data: " + length(data))
				// data = data[0]
				console.log(Object.keys(data))
			}
			console.log("Multiplex socket received other kind of data")
			console.log("CMD" + String(data.cmd))
			console.log( data.socketID )
			console.log( String(window.location.host) )
			console.log( data.cmd )

        // ignore data from sockets that aren't ours
        if (data.socketId !== socketId && typeof(data.socketId) != "undefined" ) { return; }
        if( window.location.host === 'localhost:1947' ) return;
				if( window.location.host !== 'charliecarter.github.io' ) return;

        if (data.cmd === 'state') {
            Reveal.setState(data.state);
        } else if (data.cmd === 'start') {
					console.log("'start' chalkboard event")
            var message = new CustomEvent('received');
            message.content = { sender: 'chalkboard-plugin', type: 'startDrawing', x: data.xx, y: data.yy, erase: false};
            document.dispatchEvent( message );
        } else if (data.cmd === 'segm') {
					console.log("'segm' chalkboard event")
            var message = new CustomEvent('received');
            message.content = { sender: 'chalkboard-plugin', type: 'drawSegment', x: data.xx, y: data.yy, erase: false};
            document.dispatchEvent( message );
        } else if (data.cmd === 'init') {
					console.log("'init' chalkboard event")
            var message = new CustomEvent('received');
            message.content = { sender: 'chalkboard-plugin', type: 'init', storage: data.sto};
            document.dispatchEvent( message );
            console.log("client sent storage to chalkboard");
        } else if (data.cmd === 'animate') {
            if (typeof mplexanim !== null) {
                mplexanim();
            }
        } else if (data.cmd === 'raz') {
					console.log("'raz' chalkboard event")
            var message = new CustomEvent('received');
            message.content = { sender: 'chalkboard-plugin', type: 'resetSlide'};
            document.dispatchEvent( message );
        } else if (data.cmd === 'end') {
					console.log("'end' chalkboard event")
            var message = new CustomEvent('received');
            message.content = { sender: 'chalkboard-plugin', type: 'stopDrawing', erase: false};
            document.dispatchEvent( message );
        } else if (data.cmd === 'pollactive') {
            pollvisible(true);
        } else if (data.cmd === 'pollclosed') {
            pollvisible(false);
        }
	});
}());
