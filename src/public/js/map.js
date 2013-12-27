function initialize() {
    var markers = {};
    var infowindow = new google.maps.InfoWindow();
    var map_canvas = document.getElementById('map');
    var map_options = {
          center: new google.maps.LatLng(50.450072, 30.523453),
          zoom: 14,
          mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(map_canvas, map_options);

    function createHandler(content, map, marker) {
        return function(center) {
            infowindow.setContent(content);
            if (center)
                map.setCenter(marker.getPosition());
            infowindow.open(map, marker);
        };
    }

    // Add markers
    window.addMapMarker = function(ev) {
        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(ev.latitude, ev.longitude),
            map: map,
            title: ev.text
        });

        var contentString = '<div id="content">'+
            '<div id="siteNotice">'+
            '</div>'+
            '<h3 id="firstHeading" class="firstHeading">' + ev.title + '</h3>'+
            '<div id="bodyContent"><p>'+ ev.description + '</p>' +
            '<small>' + ev.address + '</small>' +
            '</div>'+
            '</div>';

        var handler = createHandler(contentString, map, marker);
        google.maps.event.addListener(marker, 'click', handler);

        markers[ev._id] = handler;

        $('.event[data-index="' + ev._id + '"]').click(function(e) {
            if (!$(e.target).closest('a').length) {
                var handler = markers[$(this).attr("data-index")];
                handler();
            }
        });

        return handler;
    };

    var events = JSON.parse($("#map").attr("data-locations"));
    for (var i in events) {
        window.addMapMarker(events[i]);
    }

    var selected = JSON.parse($("#map").attr("data-highlight"));
    if (selected) {
        var marker = markers[selected._id];
        if (!marker)
            marker = window.addMapMarker(selected);
        $(document).ready(function() {
            marker(true);
        });
    }
}

google.maps.event.addDomListener(window, 'load', initialize);
