(function() {
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
        pollvisible(true);
	});
    socket.on('pollclosed', data => {
        pollvisible(false);
	});

    socket.on(multiplex.id, function(data) {
        // ignore data from sockets that aren't ours
        if (data.socketId !== socketId) { return; }
        if( window.location.host === 'localhost:1947' ) return;

        if (data.cmd === 'state') {
            Reveal.setState(data.state);
        } else if (data.cmd === 'start') {
            var message = new CustomEvent('received');
            message.content = { sender: 'chalkboard-plugin', type: 'startDrawing', x: data.xx, y: data.yy, erase: false};
            document.dispatchEvent( message );
        } else if (data.cmd === 'segm') {
            var message = new CustomEvent('received');
            message.content = { sender: 'chalkboard-plugin', type: 'drawSegment', x: data.xx, y: data.yy, erase: false};
            document.dispatchEvent( message );
        } else if (data.cmd === 'init') {
            var message = new CustomEvent('received');
            message.content = { sender: 'chalkboard-plugin', type: 'init', storage: data.sto};
            document.dispatchEvent( message );
            console.log("client sent storage to chalkboard");
        } else if (data.cmd === 'animate') {
            if (typeof mplexanim !== null) {
                mplexanim();
            }
        } else if (data.cmd === 'raz') {
            var message = new CustomEvent('received');
            message.content = { sender: 'chalkboard-plugin', type: 'resetSlide'};
            document.dispatchEvent( message );
        } else if (data.cmd === 'end') {
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
