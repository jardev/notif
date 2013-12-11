var map;
var geocode;

function initialize() {
    var address = null;
    var map_canvas = document.getElementById('address-map');
    var map_options = {
          center: new google.maps.LatLng(50.450072, 30.523453),
          zoom: 14,
          mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(map_canvas, map_options);

    function changeAddress(value) {
        if (address == value)
            return;
        address = value;
        codeAddress(address);
    }

    $('#address').donetyping(function() {
        changeAddress($(this).val());
    });

    $('#address').change(function() {
        changeAddress($(this).val());
    });
}

function codeAddress(address) {
    geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'address': address
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            $('#latitude').val(results[0].geometry.location.lat());
            $('#longitude').val(results[0].geometry.location.lng());

            var myOptions = {
                zoom: 16,
                center: results[0].geometry.location,
                mapTypeId: google.maps.MapTypeId.ROADMAP
            };
            map = new google.maps.Map(document.getElementById("address-map"), myOptions);

            var marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location
            });
        }
    });
}

google.maps.event.addDomListener(window, 'load', initialize);