(function() {

	// Don't emit events from inside of notes windows
	if ( window.location.search.match( /receiver/gi ) ) { return; }

	var multiplex = Reveal.getConfig().multiplex;
	var socket = io.connect( multiplex.url );

    // ======================== for polls
    var pollyes=0;
    var pollno=0;
    var pollvisible=false;
    socket.emit('iammaster',{'pollvisible':pollvisible});

    // fct called when the master press T
    function initPoll() {
        // toggle poll on the clients
	var messageData = { 
		cmd: 'pollactive',
		secret: multiplex.secret,
		socketId: multiplex.id
	}
	if (pollvisible) pollvisible=false; else pollvisible=true;
	if (!pollvisible) messageData.cmd = 'pollclosed';
        socket.emit( 'multiplex-statechanged', messageData );
        // make the poll buttons visible
        el = document.getElementById("poverlay");
        el.style.visibility = (el.style.visibility == "visible") ? "hidden" : "visible";
        pollyes=0; pollno=0;
        document.getElementById("mplexpollyes").innerHTML=""+pollyes;
        document.getElementById("mplexpollno").innerHTML=""+pollno;
        document.getElementById("pollbyes").disabled=false;
        document.getElementById("pollbno").disabled=false;
    }
    // util fct called when receiving a poll result from other clients
    function handlepollres(isyes) {
        if (isyes==1) {
            pollyes=pollyes+1;
            document.getElementById("mplexpollyes").innerHTML=""+pollyes;
        } else {
            pollno=pollno+1;
            document.getElementById("mplexpollno").innerHTML=""+pollno;
        }
    }
    // fct called when the local user press a button to answer the poll
    function poll(isyes) {
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

    // ========================== for the chalkboard
    document.addEventListener('send', event => {
		var messageData = {
            cmd: '', xx: 0, yy: 0, sto: null,
			state: Reveal.getState(),
			secret: multiplex.secret,
			socketId: multiplex.id
		};
        var e = event.content.type;
        if (e==="startDrawing") {
            messageData.cmd = 'start';
            messageData.xx = event.content.x;
            messageData.yy = event.content.y;
        } else if (e==="init") {
            messageData.cmd = 'init';
            messageData.sto = event.content.storage;
            socket.emit( 'multiplex-statechanged', messageData );
            return;
        } else if (e==="drawSegment") {
            messageData.cmd = 'segm';
            messageData.xx = event.content.x;
            messageData.yy = event.content.y;
        } else if (e==="resetSlide") {
            messageData.cmd = 'raz';
        } else if (e==="animate") {
            messageData.cmd = 'animate';
        } else if (e==="stopDrawing") {
            messageData.cmd = 'end';
        }
		socket.emit( 'multiplex-statechanged', messageData );
    });

	function post() {
		var messageData = {
            cmd: 'state',
			state: Reveal.getState(),
			secret: multiplex.secret,
			socketId: multiplex.id
		};
		socket.emit( 'multiplex-statechanged', messageData );
	};

	// post once the page is loaded, so the client follows also on "open URL".
	window.addEventListener( 'load', post );

	// Monitor events that trigger a change in state
	Reveal.on( 'slidechanged', post );
	Reveal.on( 'fragmentshown', post );
	Reveal.on( 'fragmenthidden', post );
	Reveal.on( 'overviewhidden', post );
	Reveal.on( 'overviewshown', post );
	Reveal.on( 'paused', post );
	Reveal.on( 'resumed', post );

    Reveal.addKeyBinding( { keyCode: 84, key: 'T', description: 'Poll' }, initPoll );

}());
