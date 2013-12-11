$(document).ready(function() {
    var socket = io.connect('http://localhost:3000/');

    socket.on('connect', function(data) {
        setStatus('connected');
        socket.emit('subscribe', { channel: 'news' });
    });

    socket.on('reconnecting', function(data) {
        setStatus('reconnecting');
    });

    socket.on('message', function(data) {
        addMessage(data);
    });

    function addMessage(data) {
        // Show news
        var $item = $(data);
        var $news = $('#news').prepend($item);
        $item.show('slow');

        // Update map
        window.addMapMarker(JSON.parse($item.attr("data-location")));
    }

    function setStatus(msg) {
        console.log('Connection Status: ' + msg);
    }
});