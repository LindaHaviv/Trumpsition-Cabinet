$(function () {

    var $activeBio = null;


    $.fn.circleList = function (data, opts, optsMember) {
        var $self = this;

        opts = $.extend({
            buttonTextClose: "Open"
          , buttonTextOpen: "Close"
          , hoverText: ""
        }, opts);

        optsMember = $.extend({
            buttonTextClose: "Open"
          , buttonTextOpen: "Close"
          , hoverText: ""
        }, optsMember);

        var $liTemplate = $(
               "<li class='candidate-item'>"
             + "   <a class='circle-list-item'>"
             + "           <img src='' class='circle-list-item-img'>"
             + "           <span class='circle-list-item-label'></span>"
             + "    </a>"
             + "</li>"
        );

        var $circleList = $("<div>", { "class": "circle-list" });
        var $ul = $("<ul>").appendTo($circleList);
        var $bios = $("<div>", { "class": 'position-bios' }).appendTo($circleList);
        var $button = $("<button class='position-title'>").appendTo($circleList).text(opts.buttonText);
        var $hoverText = $("<div>", { "class": "hover-text", html: opts.hoverText }).appendTo($circleList);

        $ul.append(data.map(function (c) {
            var $newItem = $liTemplate.clone();
            var $img = $("img", $newItem);
            var $label = $(".circle-list-item-label", $newItem);
            var $bio = $(".position-bios", $newItem);

            if (c.image) {
                $img.attr("src", c.image);
            } else {
                $img.remove();
                $newItem.addClass("no-image");
            }

            if (c.label) {
                $label.text(c.label);
            } else {
                $img.remove();
                $newItem.addClass("no-label");
            }

            if (c.bio) {
                $bios.append($("<div>", {
                    "class": "bio-item",
                    html: c.bio,
                    "data-name": c.name
                }));
            } else {
                $newItem.addClass("no-bio");
            }

            $newItem.data("candidate", c);
            if (c.confirmed) {
              $newItem.addClass("candidate-confirmed");
            }

            return $newItem;
        }));

        var $liElms = $ul.children();
        $self.empty().append($circleList);

        $button.hover(function () {
            $circleList.addClass("hovered");
            $button.text("");
        }, function () {
            $circleList.removeClass("hovered");
            $button.text(opts.buttonTextOpen);
        });

        function rotate($li,d) {
            $li.css("transform", "rotate(" + d + "deg)");
            $("span", $li).css("transform", "rotate(" + (-d) + "deg)");
            $(".circle-list-item-label", $li).css("transform", "rotate(" + (-d) + "deg)");
            if (isOpened) {
                $("img", $li).css("transform", "rotate(" + (-d) + "deg)");
            }
        }

        var angleStart = -360;
        function rotateElms(s) {
            var deg = 360 / $liElms.length;
            for(var i = 0; i < $liElms.length; ++i) {
                var d = i * deg;
                var $cLi = $liElms.eq(i);
                rotate($cLi, isOpened ? d : angleStart);
            }
        }

        //FOR MAIN CIRCLE LIST
        var isOpened = false;

        $self.on("circlelist:toggle", function () {
            isOpened = !isOpened;
            $self.trigger("circlelist:" + (isOpened ? "open" : "close"));
        });

        $self.on("circlelist:open", function () {
            isOpened = true;
            rotateElms();
            $circleList.removeClass("close");
            $circleList.addClass("open");
            $circleList.removeClass("hovered");
            $button.html(opts.buttonTextOpen);
        });

        $self.on("circlelist:close", function () {
            isOpened = false;
            rotateElms();
            $circleList.addClass("close");
            $circleList.removeClass("open");
            $circleList.removeClass("hovered");
            $button.html(opts.buttonTextClose);
        });

        $self.trigger("circlelist:close");

        $button.click(function () {
            $self.trigger("circlelist:toggle");
        });

        //make candidates themselves clickable
        $('.candidate-item', $self).on('click', function () {
            var $this = $(this);
            var $bio = $("[data-name='" + $this.data("candidate").name + "']", $self);
            if ($bio.hasClass("active")) { return; }
            setTimeout(function() {
                $activeBio = $bio;
                $(".bio-item", $self).removeClass("active");
                $bio.addClass("active");
                $this.addClass("active");
                $button.addClass("hover");
                $circleList.addClass("bio-circle");
            }, 0);
        });
    };


    $.getJSON("data.json", function (data) {
        var $listOfPositions = $(".list-of-positions");
        var $cabinetPosition = $(".templates .cabinet-position");

        var allCandidates = [];
        var confirmedCandidates = [];
        var unconfirmedCandidates = [];

        $listOfPositions.html(data.cabinetPositions.map(function (currentPosition) {
            var $newItem = $cabinetPosition.clone();
            $newItem.circleList(currentPosition.predictions.map(function (c) {
                c.label = c.name;
                c.bio = c.description;
                return c;
            }), {
                buttonTextClose: currentPosition.title,
                buttonTextOpen: currentPosition.title,
                hoverText: currentPosition.description
            });
            $newItem.attr("data-position-title", currentPosition.title);

            currentPosition.predictions.forEach(c => {
                c._ = currentPosition;
            });

            allCandidates = allCandidates.concat(currentPosition.predictions);

            var confirmedCandidate = currentPosition.predictions.filter(function (c) {
                return c.confirmed;
            })[0];

            // some, every
            if (confirmedCandidate) {
                currentPosition.confirmedCandidate = confirmedCandidate;
                $newItem.addClass("position-confirmed");
            }

            //$("pre", $newItem).text(JSON.stringify(currentPosition, null, 2));
            return $newItem;
        }));

        var cabinetPositions = data.cabinetPositions;
        var doNotRequireSenateConfirmation = cabinetPositions.filter(function (c) {
            return !c.senate_confirmation;
        });

        var doRequireSenateConfirmation = cabinetPositions.filter(function (c) {
            return c.senate_confirmation
        });

        doRequireSenateConfirmation.sort(function (a, b) {
            return a.confirmed ? 1 : -1;
        });

        var $bottleTemplate = $(".templates .bottle");
        var $cabinetContainer = $(".cabinet");
        function addPositionBottle (cPosition, $shelf) {
            var $newItem = $bottleTemplate.clone();
            var noteText = "<h2>" + cPosition.title + "</h2>";
            if (cPosition.confirmedCandidate) {
                $(".label", $newItem).css("background-image", "url(" + cPosition.confirmedCandidate.image + ")");
                noteText += "<p>Confirmed: <strong>" + cPosition.confirmedCandidate.name + "</strong></p>";
            }
            $(".note", $newItem).html(noteText);
            $newItem.data("position", cPosition);
            $shelf.append($newItem);
        }

        function renderPositions() {
            var _allPositions = [].concat(doRequireSenateConfirmation);
            var perRow = 6;
            var $shelfs = $(".shelf", $cabinetContainer);

            var $firstShelf = $shelfs.first();
            doNotRequireSenateConfirmation.forEach(function (c) {
                addPositionBottle(c, $firstShelf);
            });

            $shelfs.slice(1).each(function () {
                var $cShelf = $(this);
                for (var i = 0; i < perRow; ++i) {
                    var cPosition = _allPositions.pop();
                    if (!cPosition) { return; }
                    addPositionBottle(cPosition, $cShelf);
                }
            });
        }

        renderPositions();


        $('.carousel').carousel({
            dist: -70,
            padding: 40
        }).css("opacity", 0);

        setTimeout(function() {
            $('.carousel').animate({ opacity: 1 });
            $(window).resize();
        }, 100);

        $(document).add(".candidate-item, .cabinet-position").click(function (e) {
            if (!$activeBio) { return; }
            var $target = $(e.target);
            if (!$target.closest($activeBio).length) {
                $activeBio.removeClass("active");
                $activeBio = null;
                $("button.position-title").removeClass("hover");
                $(".circle-list").removeClass("bio-circle");
                $(".candidate-item").removeClass("active");
            }
        });
        $(".cabinet-position").click(function () {
            $(".cabinet-position").not(this).trigger("circlelist:close")
        });
    });


    //CABINET
    $('.door').click(function() {
    setTimeout(function() {
        $('.door').toggleClass('clicked');
    }, 1000);
    })
    $(".door").click();


    //gray out other candidates that are not confirmed and add green border to one that is.

    // CLOCK COUNTDOWN

        /**
     * Get remaining time
     * @param endtime - date object
     */
    function getTimeRemaining(endtime) {
      var t = Date.parse(endtime) - Date.parse(new Date());
      var seconds = Math.floor((t / 1000) % 60);
      var minutes = Math.floor((t / 1000 / 60) % 60);
      var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
      var days = Math.floor(t / (1000 * 60 * 60 * 24));
      return {
        'total': t,
        'days': days,
        'hours': hours,
        'minutes': minutes,
        'seconds': seconds
      };
    }

    /**
     * Initialize clock
     * @param id - a string of css rules
     * @param endtime - date object
     */
    function initializeClock(id, endtime) {
      var clock = document.getElementById(id);
      var daysSpan = clock.querySelector('.days');
      var hoursSpan = clock.querySelector('.hours');
      var minutesSpan = clock.querySelector('.minutes');
      var secondsSpan = clock.querySelector('.seconds');

      function updateClock() {
        var t = getTimeRemaining(endtime);

        daysSpan.innerHTML = t.days;
        hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
        minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
        secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

        if (t.total <= 0) {
          clearInterval(timeinterval);
        }
      }

      updateClock();
      var timeinterval = setInterval(updateClock, 1000);
    }

    // Initialize countdown clock
    var deadline = new Date(Date.parse(new Date()) + 44 * 24 * 60 * 60 * 1000);
    initializeClock('clockdiv', deadline);



    $(document).on("click", ".bottle", function () {
        var $this = $(this);
        var cPosition = $this.data("position");
        $(".cabinet-position[data-position-title='" + cPosition.title + "'] .circle-list button").click();
    });

    // http://hilios.github.io/jQuery.countdown/
    // $('#clock').countdown('2017/01/20 12:34:56')
    // .on('update.countdown', function(event) {
    //  var format = '%H:%M:%S';
    //  if(event.offset.totalDays > 0) {
    //    format = '%-d day%!d ' + format;
    //  }
    //  if(event.offset.weeks > 0) {
    //    format = '%-w week%!w ' + format;
    //  }
    //  $(this).html(event.strftime(format));
    // })
    // .on('finish.countdown', function(event) {
    //  $(this).html('This offer has expired!')
    //    .parent().addClass('disabled');

    // });
});