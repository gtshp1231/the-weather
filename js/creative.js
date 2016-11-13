function showTime() {
    var date = new Date();
    var localTime = date.toLocaleTimeString().substring(2);
    var localDate = date.toDateString();
    document.getElementById('time').innerHTML = localTime;
    setTimeout(showTime, 1000);
    document.getElementById('date').innerHTML = localDate;
}

function getWeather() {
    var userSelect = userLocation($('#city').val());
    $('.cityName').html(siteNameEng(userSelect));
    $.get('https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20weather.forecast%20where%20woeid%3D' + $('#city').val() + '%20AND%20u%3D%22c%22&format=xml&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys', function(xml) {
        console.log($(xml).find('forecast').length);
            
            $(xml).find('forecast').each(function(index) {
            var div = $('.report:eq(' + index + ')').empty();
            $('<h3></h3>').text($(this).attr('day')).appendTo(div);
            $(setWeatherIcon($(this).attr('code'))).appendTo(div);
            $('<h5 style="height: 30px;"></h5>').text($(this).attr('text')).appendTo(div);
            $('<h4></h4>').text($(this).attr('high') + ' °C').appendTo(div);
            $('<h4></h4>').text($(this).attr('low') + ' °C').appendTo(div);

        });
        $('#description').html($(xml).find('description').text());
    });
}

var mymap = new google.maps.Map(document.getElementById('mymap'), {
        center: {lat:23.340558, lng:121.007495},
        zoom: 7
    });

function getUVI() {
    $.ajax({
        url: 'http://opendata.epa.gov.tw/ws/Data/UV/?format=json',
        dataType: 'jsonp',
        success: onsuccessUVI,
        error: function() { console.log(error); },
        complete: function() { $('#download').attr('disabled', false).text('Refresh'); }
    });
}

function getPM25() {
    $.ajax({
        url: 'http://opendata.epa.gov.tw/ws/Data/REWXQA/?$orderby=SiteName&$skip=0&$top=1000&format=json',
        dataType: 'jsonp',
        success: onsuccessPM25
    });
}

function onsuccessUVI(data) {
    if (data == null) {
        alert("Can't download UVI!");
        return;
    }

    $('#uv').empty();
    $.each(data, function(index, object) {
        if (this.UVI != "") {
            var div = $('<div></div>').addClass('area');
            var uviNum = parseInt(this.UVI);
                            
            if (uviNum >= 0 && uviNum <= 2) {
                div.addClass('low');
            } else if (uviNum >= 3 && uviNum <= 5) {
                div.addClass('medium');
            } else if (uviNum >= 6 && uviNum <= 7) {
                div.addClass('high');
            } else if (uviNum >= 8 && uviNum <= 10) {
                div.addClass('over');
            } else if (uviNum >= 11) {
               div.addClass('danger');
            }

            var site = $('<span></span>').text(siteNameEng(this.SiteName));
            var uvi = $('<span style="font-size: 130%; font-weight: 700;"></span>').text(' ' + this.UVI);
            div.append(site).append(uvi);

            if (this.County == '新北市' || this.County == '臺北市'
                || this.County == '苗栗縣' || this.County == '桃園市'
                || this.County == '新竹縣' || this.County == '基隆市'
                || this.County == '桃園縣') {
                $('#uvNorth').append(div);
            } else if (this.County == '雲林縣' || this.County == '南投縣'
                || this.County == '彰化縣' || this.County == '臺中市') {
                $('#uvWest').append(div);
            } else if (this.County == '屏東縣' || this.County == '高雄市'
                || this.County == '臺南市' || this.County == '嘉義縣'
                || this.County == '嘉義市') {
                $('#uvSouth').append(div);
            } else if (this.County == '花蓮縣' || this.County == '臺東縣'
                || this.County == '宜蘭縣') {
                $('#uvEast').append(div);
            } else if (this.County == '連江縣' || this.County == '澎湖縣'
                || this.County == '金門縣') {
                $('#uvIsland').append(div);
            }
                
                
        }
        var WGS84Lat = object['WGS84Lat'].split(',');
        var WGS84Lon = object['WGS84Lon'].split(',');
        var newLat = parseFloat(WGS84Lat[0]) + parseFloat(WGS84Lat[1])/60 + parseFloat(WGS84Lat[2])/3600;
        var newLng = parseFloat(WGS84Lon[0]) + parseFloat(WGS84Lon[1])/60 + parseFloat(WGS84Lon[2])/3600;
        var latlng = {lat: newLat, lng: newLng};

        var marker = new google.maps.Marker({
            position: latlng,
            map: mymap,
            title: object['SiteName'],
            label: this.UVI,
            icon: 'img/sun.png'
        });
    });
}

function onsuccessPM25(data) {
    var userSelect = userLocation($('#city').val());
    var url = 'https://maps.googleapis.com/maps/api/staticmap?center=' + userSelect + '&zoom=11&size=700x500';
    $.each(data, function(index, object) {
        if (object['County'] == userSelect) {
            console.log(object);
            var markerColor;
            var PM25 = parseInt(object['PM2.5']);
            if (PM25 >= 0 && PM25 <= 35) {
                markerColor = 'color:green|';
            } else if (PM25 >= 36 && PM25 <= 53) {
                markerColor = 'color:orange|';
            } else if (PM25 >= 54 && PM25 <= 70) {
                markerColor = 'color:red|';
            } else if (PM25 >= 71) {
                markerColor = 'color:purple|';
            }
            var place = '&markers=' + markerColor + object['SiteName'];
            url +=  place;
        }
                
    });
    $('#pm25').attr('src', url);
}

$(function() {
    showTime();

    $('#download').click(function() {
        $('#download').attr('disabled', true).text('Loading...');

        getUVI();
    });

    $('#download').click();

    $('#city').change(function() {
        getPM25();
        getWeather();
    });
    
    $('#city').change();
});

// 使用外部weather icon

function setWeatherIcon(condid) {

  switch(condid) {
    case '0': var icon  = '<i class="wi wi-tornado"></i>';
    break;
    case '1': var icon  = '<i class="wi wi-storm-showers"></i>';
    break;
    case '2': var icon  = '<i class="wi wi-tornado"></i>';
    break;
    case '3': var icon  = '<i class="wi wi-thunderstorm"></i>';
    break;
    case '4': var icon  = '<i class="wi wi-thunderstorm"></i>';
    break;
    case '5': var icon  = '<i class="wi wi-snow"></i>';
    break;
    case '6': var icon  = '<i class="wi wi-rain-mix"></i>';
    break;
    case '7': var icon  = '<i class="wi wi-rain-mix"></i>';
    break;
    case '8': var icon  = '<i class="wi wi-sprinkle"></i>';
    break;
    case '9': var icon  = '<i class="wi wi-sprinkle"></i>';
    break;
    case '10': var icon  = '<i class="wi wi-hail"></i>';
    break;
    case '11': var icon  = '<i class="wi wi-showers"></i>';
    break;
    case '12': var icon  = '<i class="wi wi-showers"></i>';
    break;
    case '13': var icon  = '<i class="wi wi-snow"></i>';
    break;
    case '14': var icon  = '<i class="wi wi-storm-showers"></i>';
    break;
    case '15': var icon  = '<i class="wi wi-snow"></i>';
    break;
    case '16': var icon  = '<i class="wi wi-snow"></i>';
    break;
    case '17': var icon  = '<i class="wi wi-hail"></i>';
    break;
    case '18': var icon  = '<i class="wi wi-hail"></i>';
    break;
    case '19': var icon  = '<i class="wi wi-cloudy-gusts"></i>';
    break;
    case '20': var icon  = '<i class="wi wi-fog"></i>';
    break;
    case '21': var icon  = '<i class="wi wi-fog"></i>';
    break;
    case '22': var icon  = '<i class="wi wi-fog"></i>';
    break;
    case '23': var icon  = '<i class="wi wi-cloudy-gusts"></i>';
    break;
    case '24': var icon  = '<i class="wi wi-cloudy-gusts"></i>';
    break;
    case '25': var icon  = '<i class="wi wi-thermometer"></i>';
    break;
    case '26': var icon  = '<i class="wi wi-cloudy"></i>';
    break;
    case '27': var icon  = '<i class="wi wi-night-cloudy"></i>';
    break;
    case '28': var icon  = '<i class="wi wi-day-cloudy"></i>';
    break;
    case '29': var icon  = '<i class="wi wi-night-cloudy"></i>';
    break;
    case '30': var icon  = '<i class="wi wi-day-cloudy"></i>';
    break;
    case '31': var icon  = '<i class="wi wi-night-clear"></i>';
    break;
    case '32': var icon  = '<i class="wi wi-day-sunny"></i>';
    break;
    case '33': var icon  = '<i class="wi wi-night-clear"></i>';
    break;
    case '34': var icon  = '<i class="wi wi-day-sunny-overcast"></i>';
    break;
    case '35': var icon  = '<i class="wi wi-hail"></i>';
    break;
    case '36': var icon  = '<i class="wi wi-day-sunny"></i>';
    break;
    case '37': var icon  = '<i class="wi wi-thunderstorm"></i>';
    break;
    case '38': var icon  = '<i class="wi wi-thunderstorm"></i>';
    break;
    case '39': var icon  = '<i class="wi wi-thunderstorm"></i>';
    break;
    case '40': var icon  = '<i class="wi wi-storm-showers"></i>';
    break;
    case '41': var icon  = '<i class="wi wi-snow"></i>';
    break;
    case '42': var icon  = '<i class="wi wi-snow"></i>';
    break;
    case '43': var icon  = '<i class="wi wi-snow"></i>';
    break;
    case '44': var icon  = '<i class="wi wi-cloudy"></i>';
    break;
    case '45': var icon  = '<i class="wi wi-lightning"></i>';
    break;
    case '46': var icon  = '<i class="wi wi-snow"></i>';
    break;
    case '47': var icon  = '<i class="wi wi-thunderstorm"></i>';
    break;
    case '3200': var icon  =  '<i class="wi wi-cloud"></i>';
    break;
    default: var icon  =  '<i class="wi wi-cloud"></i>';
    break;
  }

  return icon;

}

function siteNameEng(siteName) {
    if (siteName == '屏東' || siteName == '屏東縣') {
        return 'Pingtung';
    } else if (siteName == '橋頭') {
        return 'Chiaotou (Kaohsiung)';
    } else if (siteName == '新營') {
        return 'Hsinying (Tainan)';
    } else if (siteName == '朴子') {
        return 'Putz (Chiayi)';
    } else if (siteName == '塔塔加') {
        return 'Tataka (Nantou)';
    } else if (siteName == '阿里山') {
        return 'Alishan (Chiayi)';
    } else if (siteName == '斗六') {
        return 'Douliu (Yunlin)';
    } else if (siteName == '南投' || siteName == '南投縣') {
        return 'Nantou';
    } else if (siteName == '彰化' || siteName == '彰化縣') {
        return 'Changhua';
    } else if (siteName == '沙鹿') {
        return 'Shalu (Taichung)';
    } else if (siteName == '苗栗' || siteName == '苗栗縣') {
        return 'Miaoli';
    } else if (siteName == '桃園' || siteName == '桃園市') {
        return 'Taoyuan';
    } else if (siteName == '板橋') {
        return 'Banciao (New Taipei City)';
    } else if (siteName == '淡水') {
        return 'Tamsui (New Taipei City)';
    } else if (siteName == '花蓮' || siteName == '花蓮縣') {
        return 'Hualien';
    } else if (siteName == '馬祖' || siteName == '連江縣') {
        return 'Lienchiang';
    } else if (siteName == '高雄' || siteName == '高雄市') {
        return 'Kaohsiung';
    } else if (siteName == '玉山') {
        return 'Yushan (Nantou)';
    } else if (siteName == '臺南' || siteName == '臺南市') {
        return 'Tainan';
    } else if (siteName == '新竹' || siteName == '新竹縣' || siteName == '新竹市') {
        return 'Hsinchu';
    } else if (siteName == '鞍部') {
        return 'Beitou (Taipei)';
    } else if (siteName == '恆春') {
        return 'Hengchun (Pingtung)';
    } else if (siteName == '臺北' || siteName == '臺北市') {
        return 'Taipei';
    } else if (siteName == '成功') {
        return 'Chenggung (Taitung)';
    } else if (siteName == '基隆' || siteName == '基隆市') {
        return 'Keelung';
    } else if (siteName == '新屋') {
        return 'Hsinwu (Taoyuan)';
    } else if (siteName == '蘭嶼') {
        return 'Orchid Island (Taitung)';
    } else if (siteName == '臺東' || siteName == '臺東縣') {
        return 'Taitung';
    } else if (siteName == '日月潭') {
        return 'Sun Moon Lake (Nantou)';
    } else if (siteName == '金門' || siteName == '金門縣') {
        return 'Kinmen';
    } else if (siteName == '宜蘭' || siteName == '宜蘭縣') {
        return 'Yilan';
    } else if (siteName == '澎湖' || siteName == '澎湖縣') {
        return 'Penghu';
    } else if (siteName == '臺中' || siteName == '臺中市') {
        return 'Taichung';
    } else if (siteName == '嘉義' || siteName == '嘉義縣' || siteName == '嘉義市') {
        return 'Chiayi';
    } else if (siteName == '新北市') {
        return 'New Taipei City';
    } else if (siteName == '雲林縣') {
        return 'Yunlin';
    } else {
        return 'Unknown';
    }
}

function userLocation(number) {
    if (number == '2306188') {
        return '基隆市';
    } else if (number == '2306179') {
        return '臺北市';
    } else if (number == '20070569') {
        return '新北市';
    } else if (number == '2298866') {
        return '桃園市';
    } else if (number == '2306185') {
        return '新竹縣';
    } else if (number == '2301128') {
        return '苗栗縣';
    } else if (number == '2306181') {
        return '臺中市';
    } else if (number == '2306183') {
        return '彰化縣';
    } else if (number == '2306204') {
        return '南投縣';
    } else if (number == '2347346') {
        return '雲林縣';
    } else if (number == '2296315') {
        return '嘉義縣';
    } else if (number == '2306182') {
        return '臺南市';
    } else if (number == '2306180') {
        return '高雄市';
    } else if (number == '2306189') {
        return '屏東縣';
    } else if (number == '2306198') {
        return '宜蘭縣';
    } else if (number == '2306187') {
        return '花蓮縣';
    } else if (number == '2306190') {
        return '臺東縣';
    } else if (number == '22695856') {
        return '澎湖縣';
    } else if (number == '28760735') {
        return '金門縣';
    } else if (number == '12470575') {
        return '連江縣';
    }
}

(function($) {
    "use strict"; // Start of use strict

    // jQuery for page scrolling feature - requires jQuery Easing plugin
    $('a.page-scroll').bind('click', function(event) {
        var $anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: ($($anchor.attr('href')).offset().top - 50)
        }, 1250, 'easeInOutExpo');
        event.preventDefault();
    });

    // Highlight the top nav as scrolling occurs
    $('body').scrollspy({
        target: '.navbar-fixed-top',
        offset: 51
    });

    // Closes the Responsive Menu on Menu Item Click
    $('.navbar-collapse ul li a').click(function() {
        $('.navbar-toggle:visible').click();
    });

    // Offset for Main Navigation
    $('#mainNav').affix({
        offset: {
            top: 100
        }
    })

    // Initialize and Configure Scroll Reveal Animation
    window.sr = ScrollReveal();
    sr.reveal('.sr-icons', {
        duration: 600,
        scale: 0.3,
        distance: '0px'
    }, 200);
    sr.reveal('.sr-button', {
        duration: 1000,
        delay: 200
    });
    sr.reveal('.sr-contact', {
        duration: 600,
        scale: 0.3,
        distance: '0px'
    }, 300);

    // Initialize and Configure Magnific Popup Lightbox Plugin
    $('.popup-gallery').magnificPopup({
        delegate: 'a',
        type: 'image',
        tLoading: 'Loading image #%curr%...',
        mainClass: 'mfp-img-mobile',
        gallery: {
            enabled: true,
            navigateByImgClick: true,
            preload: [0, 1] // Will preload 0 - before current, and 1 after the current image
        },
        image: {
            tError: '<a href="%url%">The image #%curr%</a> could not be loaded.'
        }
    });
})(jQuery); // End of use strict

