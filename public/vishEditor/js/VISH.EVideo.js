VISH.EVideo = (function(V,$,undefined){

	//Old
	var state_vid;
	var nextBall; 
	var prevNextBall; 
	var RANGE = 0.300; //seconds around the ball where we should stop


	//Internals
	var evideos;
	// myEvideo = evideos['evideoId'] has:
	// myEvideo.balls = [ball1,ball2,...,ball3];
	// Each ball has id, time and an associated slide id
	var _seeking = false;
	var _displayVol = true;
	var initialized = false;

	var init = function(presentation){
		if(!initialized){
			initialized = true;
			evideos = new Array();
			_loadEvents();
		}
	};

	var _loadEvents = function(){
		if(V.Status.getDevice().desktop){
			$(document).on("click", '.evideoPlayButtonWrapper' , _onClickToggleVideo);
		} else {
			V.EventsNotifier.registerCallback(V.Constant.Event.onSimpleClick, function(params){
				var target = params.target;
				if($(target).hasClass("evideoPlayButtonWrapper") || $(target).hasClass("evideoPlayButton")){
					_onClickToggleVideo();
				};
			});
		}

		$(document).on("click", '.evideoToggleIndex.maximized, .evideoIndexSide.maximized', _minimizeIndex);
		$(document).on("click", '.evideoToggleIndex.minimized, .evideoIndexSide.minimized', _maximizeIndex);

		V.EventsNotifier.registerCallback(V.Constant.Event.onFlashcardSlideClosed, function(params){ 
			var subslideId = params.slideNumber;
			V.Debugging.log("Se ha cerrado la slide: " + subslideId);
			_onCloseSubslide(subslideId);
		});
	};


	/* Draw Methods */

	var drawEVideo = function(evideoJSON){
		var evideoId = evideoJSON.id;
		var slidesetDOM = $("#"+evideoId);

		//0. Store videoJSON
		evideos[evideoId] = evideoJSON;

		//1. VIDEO
		var videoBox =  $("<div class='evideoBox'></div>");
		$(slidesetDOM).append(videoBox);

		var videoHeader =  $("<div class='evideoHeader' style='display:none'><div class='evideoTime'><span class='evideoCurTime'>00:00</span><span class='evideoTimeSlash'>/</span><span class='evideoDuration'>00:00</span></div></div>");
		$(videoBox).append(videoHeader);

		var videoBody =  $("<div class = 'evideoBody'></div>");
		$(videoBox).append(videoBody);

		var footer = $("<div class='evideoFooter' style='display:none'></div>");
		
		var controls = $("<div class='evideoControls'>");
		//Play button
		$(controls).append("<div class='evideoControlButtonWrapper evideoPlayButtonWrapper'><img class='evideoControlButton evideoPlayButton' src='"+V.ImagesPath + "customPlayer/eVideoPlay.png'></img></div>");
		//Volume button
		var volButton = $("<div class='evideoControlButtonWrapper evideoVolButtonWrapper'><img class='evideoControlButton evideoVolButton' src='"+V.ImagesPath + "customPlayer/eVideoSound.png'></img></div>");
		$(volButton).append("<div class='evideoVolSliderWrapper'><div class='evideoVolSlider'></div></div>");
		$(controls).append(volButton);
		//Progress bar
		var progressBarWrapper = $("<div class='evideoProgressBarWrapper'></div>");
		var progressBar = $("<div class='evideoProgressBarSliderWrapper'><div class='evideoProgressBarSlider'></div></div>");
		var videoSegments = $("<div class='segmentDiv'></div><ul class='evideoSegments'></ul>");
		$(progressBarWrapper).append(progressBar);
		$(progressBarWrapper).append(videoSegments);
		$(controls).append(progressBarWrapper);

		$(footer).append(controls);
		$(videoBox).append(footer);

		//1.1 Position Slider
		var posSlider = $(controls).find(".evideoProgressBarSlider");
		$(posSlider).slider({
			orientation: "horizontal",
			range: "min",
			min: 0,
			max: 100,
			value: 0,
			step: 0.1,
			slide: function(event, ui){
			}, start: function(event,ui){
				_seeking = true;
				_displayVol = false;
			}, stop: function(event, ui){
				var video = $(videoBody).children()[0];
				_onSlideProgressBar(video,ui.value);
				setTimeout(function(){
					_seeking = false;
				},700);
				setTimeout(function(){
					_displayVol = true;
				},100);
			}, create: function(event,ui){
			}
		});

		//1.2 Volume Slider
		var volSlider = $(controls).find(".evideoVolSlider");
		$(volSlider).slider({
			orientation: "vertical",
			range: "min",
			min: 0,
			max: 100,
			value: 100,
			slide: function( event, ui ) {
				var video = $(".evideoBox").has(event.target).find(".evideoBody").children()[0];
				_onVolumeChange(video,ui.value);
			}
		});

		var hoverTimeout;
		$(volButton).hover(function(event){
			if(_displayVol){
				hoverTimeout = setTimeout(function(){
					var sliderWrapper = $(".evideoControls").has(event.target).find(".evideoVolSliderWrapper");
					$(sliderWrapper).show();
				},150);
			}
		}, function(event){
			clearTimeout(hoverTimeout);
			var sliderWrapper = $(".evideoControls").has(event.target).find(".evideoVolSliderWrapper");
			$(sliderWrapper).hide();
		});

		//2. INDEX
		var indexBox = $("<div class='evideoIndexBox'></div>");
		var indexSide = $("<div class='evideoIndexSide maximized'><div class='evideoToggleIndex maximized'></div></div>");
		var indexBody = $("<div class='evideoIndexBody'><ul class='evideoChapters'></ul></div>");
		$(indexBox).append(indexBody);
		$(indexBox).append(indexSide);
		$(slidesetDOM).append(indexBox);
	};

	/* Load Methods */
	var loadEVideo = function(evideoId){
		_renderVideo(evideoId);
	};

	var _renderVideo = function(evideoId){
		var evideoJSON = evideos[evideoId];
		if((typeof evideoJSON != "object")||(typeof evideoJSON.video != "object")){
			return;
		}

		// V.Debugging.log("loadEVideo " + evideoId);
		// V.Debugging.log(evideoJSON);
		var videoBody = $(V.Slides.getCurrentSlide()).find(".evideoBody");
		$(videoBody).attr("videoType",evideoJSON.video.type);

		switch(evideoJSON.video.type){
			case V.Constant.MEDIA.HTML5_VIDEO:
				var video = $(V.Video.HTML5.renderVideoFromJSON(evideoJSON.video,{controls: false, poster: false}));
				$(video).addClass("temp_hidden");
				$(video).attr("videoType",evideoJSON.video.type);
				$(videoBody).append(video);
				V.Video.onVideoReady(video,_onVideoReady);
				break;
			case V.Constant.MEDIA.YOUTUBE_VIDEO:
				var videoWrapper = $(V.Video.Youtube.renderVideoFromJSON(evideoJSON.video));
				$(videoBody).attr("source", $(videoWrapper).attr("source"));
				$(videoBody).attr("ytcontainerid", $(videoWrapper).attr("ytcontainerid"));
				V.Video.Youtube.loadYoutubeObject($(videoBody),{controls: false, onReadyCallback: function(event){
					var iframe = event.target.getIframe();
					var video = $("#"+iframe.id);
					_onVideoReady(video);
				}});
				break;
			default:
				return;
		}
	};

	var _onVideoReady = function(video){
		var videoBody = $(video).parent();
		var videoBox = _getCurrentEVideoBox();
		var videoHeader = $(videoBox).find(".evideoHeader");
		var videoFooter = $(videoBox).find(".evideoFooter");

		var durationDOM = $(videoHeader).find(".evideoDuration");
		var duration = _fomatTime(V.Video.getDuration(video));
		$(durationDOM).html(duration);

		var significativeNumbers = duration.split(":").join("").length;
		$(video).attr("sN",significativeNumbers);

		$(video).removeClass("temp_hidden");

		_fitVideoInVideoBox(videoBox,video);

		$(videoHeader).show();
		$(videoFooter).show();

		//video events
		V.Video.onTimeUpdate(video,_onTimeUpdate);
		V.Video.onStatusChange(video,_onStatusChange);

		// _getBalls(evideoJSON);
		// _getNextBall(0);
		// _paintBalls();
		// _paintIndex();
	};

	var _fitVideoInVideoBox = function(videoBox,video){
		var videoBox = videoBox || _getCurrentEVideoBox();
		var video = video || _getCurrentEVideo();
		var eVideoBody = $(videoBox).find(".evideoBody");
		$(eVideoBody).css("height","85%");

		$(video).css("max-height","none");
		$(video).css("max-width","none");

		switch($(video).attr("videoType")){
			case V.Constant.MEDIA.HTML5_VIDEO:
				V.Utils.fitChildInParent(video);
				break;
			case V.Constant.MEDIA.YOUTUBE_VIDEO:
				break;
			default:
				break;
		}
		
		var videoHeight = $(video).height();
		var videoBody = $(video).parent();
		$(videoBody).height(videoHeight);

		var videoHeader = $(videoBox).find(".evideoHeader");
		var videoFooter = $(videoBox).find(".evideoFooter");
		var videoHeight = $(video).height();
		var videoWidth = $(video).width();

		$(videoHeader).addClass("temp_shown");
		$(videoFooter).addClass("temp_shown");
		var totalVideoBoxHeight = $(videoHeader).height() + videoHeight + $(videoFooter).height();
		$(videoHeader).removeClass("temp_shown");
		$(videoFooter).removeClass("temp_shown");

		//Remove margin from videoHeader to get videoBox height appropiattely
		$(videoHeader).css("margin-top","0px");
		var freeHeight = $(videoBox).height() - totalVideoBoxHeight;

		$(videoHeader).css("margin-top",freeHeight/2+"px");
		$(videoHeader).width(videoWidth);
		$(videoFooter).width(videoWidth);

		$(video).css("max-height","100%");
		$(video).css("max-width","100%");
	};

	var _onTimeUpdate = function(video,currentTime){
		_updateCurrentTime(video,currentTime);
		
		// if(typeof nextBall == "object"){
		// 	if(Math.abs(time - nextBall.time) < RANGE){
		// 		if(nextBall.showed == false){
		// 			_popUp(_onCloseSubslide,nextBall);
		// 		}
		// 	}
		// }
	};

	var _onStatusChange = function(video,status){
		_updatePlayButton(status);
	};


	var _onVolumeChange = function(video,volume){
		V.Video.setVolume(video,volume);
	};


	/* Unload methods */
	var unloadEVideo = function(evideoId){
	};


	/* Events */

	var _onClickToggleVideo = function(){
		var video = _getCurrentEVideo();
		_togglePlay(video);
	};

	var _togglePlay = function(video){
		var vStatus = V.Video.getStatus(video);
		if (vStatus.paused == false) {
			V.Video.pause(video);
		} else {
			V.Video.play(video);
		}
	};

	var _onSlideProgressBar = function(video,value){
		var duration = V.Video.getDuration(video);
		var timeToSeek = duration * value/100;
		V.Video.seekTo(video,timeToSeek);
	};


	/* UI methods */

	var _updateCurrentTime = function(video,currentTime){
		var videoBox = _getCurrentEVideoBox();
		var currentTime = (typeof currentTime != "undefined") ? currentTime : V.Video.getCurrentTime(video);

		if(!_seeking){
			//Update progress bar
			var progressBar = $(videoBox).find("div.evideoProgressBarSlider");
			var percentage = (100*currentTime)/V.Video.getDuration(video);
			$(progressBar).slider("value",percentage);
		}

		//Update current time field
		var currentTimeField = $(videoBox).find(".evideoCurTime");
		$(currentTimeField).html(_fomatTime(currentTime,parseInt($(video).attr("sN"))));
	};

	var _updatePlayButton = function(vStatus){
		var eVideoPlayButton = $(V.Slides.getCurrentSlide()).find(".evideoPlayButton");
		if(vStatus.paused === true){
			$(eVideoPlayButton).attr("src", V.ImagesPath + "customPlayer/eVideoPlay.png");
		} else {
			$(eVideoPlayButton).attr("src", V.ImagesPath + "customPlayer/eVideoPause.png");
		}
	};

	var _minimizeIndex = function(){
		var eVideoIndexBox = _getCurrentEVideoIndexBox();
		var indexBody = $(eVideoIndexBox).find(".evideoIndexBody");

		var animationId = V.Utils.getId("animation");	
		$(eVideoIndexBox).animate({width: "5%"}, 1000, function(){ V.Utils.checkAnimationsFinish(animationId,2,_onFinishMinimizeIndex)});
		var indexBodyWidth = $(eVideoIndexBox).width()*0.05;
		$(indexBody).animate({width: indexBodyWidth + ""}, 1000, function(){ V.Utils.checkAnimationsFinish(animationId,2,_onFinishMinimizeIndex)});
	};

	var _onFinishMinimizeIndex = function(){
		var eVideoBox = _getCurrentEVideoBox();
		$(eVideoBox).css("width","93%");
		_updateIndexButtonUI(false);
		_redimensionateVideoAfterIndex();
	};

	var _maximizeIndex = function(){
		var eVideoIndexBox = _getCurrentEVideoIndexBox();
		var indexBody = $(eVideoIndexBox).find(".evideoIndexBody");

		var animationId = V.Utils.getId("animation");
		$(eVideoIndexBox).animate({width: "28%"}, 1000, function(){ V.Utils.checkAnimationsFinish(animationId,2,_onFinishMaximizeIndex)});
		$(indexBody).animate({width: "78%"}, 1000, function(){ V.Utils.checkAnimationsFinish(animationId,2,_onFinishMaximizeIndex)});
	};

	var _onFinishMaximizeIndex = function(){
		var eVideoBox = _getCurrentEVideoBox();
		$(eVideoBox).css("width","70%");
		_updateIndexButtonUI(true);
		_redimensionateVideoAfterIndex();
	};

	var _updateIndexButtonUI = function(maximized){
		var eVideoIndexSide =  $(_getCurrentEVideoIndexBox()).find(".evideoIndexSide");
		var button = $(eVideoIndexSide).find(".evideoToggleIndex");
		if(maximized===true){
			$(eVideoIndexSide).removeClass("minimized").addClass("maximized");
			$(button).removeClass("minimized").addClass("maximized");
		} else {
			$(eVideoIndexSide).removeClass("maximized").addClass("minimized");
			$(button).removeClass("maximized").addClass("minimized");
		}
	};

	var _redimensionateVideoAfterIndex = function(){
		_fitVideoInVideoBox();
	};

	var _fixForWrongProgressBarRendering = function(videoBox){
		var progressBar = $(videoBox).find("div.evideoProgressBarSlider");
		$(progressBar).css("overflow","hidden");
		var progressBarMarker = $(progressBar).find(".ui-slider-handle");
		$(progressBarMarker).css("height","122%");
		$(progressBarMarker).css("margin-top","0%");

		var eVideoVolSlider = $(videoBox).find(".evideoVolSlider");
		$(eVideoVolSlider).css("overflow","hidden");
		var eVideoVolSliderMarker = $(eVideoVolSlider).find(".ui-slider-handle");
		$(eVideoVolSliderMarker).css("width","125%");
		$(eVideoVolSliderMarker).css("left","-20%");
	};

	var aftersetupSize = function(increase,increaseW){
		_fitVideoInVideoBox();

		//Resize and center index button
		var videoIndexBox = _getCurrentEVideoIndexBox();
		var indexBody = $(videoIndexBox).find(".evideoIndexBody");
		var indexSide = $(videoIndexBox).find(".evideoIndexSide");
		
		var button = $(videoIndexBox).find(".evideoToggleIndex");
		//Resize it
		var buttonDimensions = V.ViewerAdapter.getDimensionsForResizedButton(increase,18,0.75);
		$(button).width(buttonDimensions.width);
		$(button).height(buttonDimensions.height);

		//Center vertically
		$(button).css("top",($(indexSide).height() - $(button).height())/2 + "px");
		//Relocate it horizontally
		var indexSideWidth = $(indexSide).width() - ($(indexBody).width()+$(indexBody).cssNumber("padding-right"));
		$(button).css("left", Math.max(0,(indexSideWidth - $(button).width())/2.5) + "px");
	};

	var _getNextBall = function(time){
		if(typeof time != "number"){
			return null;
		}

		var myNextball;
		var pTime = video.duration;
		
		for (i = 0; i < balls.length; i++) {
			var ball = balls[i];
			var ballTime = parseFloat(ball.time);
			if((ballTime < pTime)&&(ballTime > 0)&&(ballTime > time)){
				if(ball != nextBall){
					myNextball = ball;
					break;
				}
			}
		}
				
		if(myNextball){
			nextBall = myNextball;
			}else{
			nextBall = undefined;
			}
				return nextBall;
	};

	var _resetShowParams = function(){
		$(balls).each(function(index,ball){
			ball.showed = false;
		});	
	};

	var _popUp = function(callback, ball){
		var video = _getCurrentEVideo();
		if (video.paused == false) {
			state_vid = true;
		}else{
			state_vid = false;
		}
			video.pause();
			var slide_id = ball.slide_id;
			ball.showed = true;

			V.Slides.openSubslide(slide_id,true);
	};

	var _onCloseSubslide = function(subslide_id){
		var video = $('#' + myvideoId)[0];
		var prevNextBall = nextBall;
		_getNextBall(video.currentTime);
		if(nextBall-prevNextBall < RANGE){
			_popUp(_onCloseSubslide,nextBall);		
		}else{
			if(state_vid == true){
				video.play(); // we have to know the previous state of the video
				$(V.Slides.getCurrentSlide()).find(".evideoPlayButton").attr("src","images/evideo/pause.png");
			}else{
				video.pause();
			}
		}
	};

	var _getBalls = function(evideoJSON){
		for (i = 0; i < evideoJSON.pois.length; i++) {
			var ball = {};
			ball.id = evideoJSON.pois[i].id;
			ball.time = parseFloat(evideoJSON.pois[i].time);
			ball.slide_id = evideoJSON.pois[i].slide_id;
			ball.showed = false;
			ball.minTime = ball.time - RANGE;
			ball.maxTime = ball.time + RANGE;
			balls.push(ball);
		}

		balls.sort(function(A,B){
			return A.time>B.time;
		});
	};

	var _paintIndex = function(){
		var video = _getCurrentEVideo();
		for (i = 0; i < balls.length; i++) {
			var item = document.createElement('li');
			item.id = balls[i].id;
			var link = document.createElement('a');
			link.setAttribute('ident', i);
			link.setAttribute('time', balls[i].time);
			link.innerHTML = (i+1) + '.'+ '    ' + balls[i].slide_id;
			$(item).append(link);
			$(V.Slides.getCurrentSlide()).find(".evideoChapters").append(item);
		}

		$(V.Slides.getCurrentSlide()).find(".evideoChapters li a").on("click", function(event){
		video.currentTime = $(event.target).attr("time");
		$(V.Slides.getCurrentSlide()).find(".evideoPlayButton").attr("src",V.ImagesPath + "customPlayer/eVideoPlay.png");
		_popUp(_onCloseSubslide,balls[parseInt($(event.target).attr("ident"))]); //migrated to JQuery working
		});
	};

	var _videoPlayPause = function(evt) {
		var video = _getCurrentEVideo();
		if (evt.keyCode == "32") { // space bar
			_togglePlay(video);
		}
		if (evt.keyCode == "13") { // enter key
			seekChapter(this.getAttribute('data-chapter'));
			// stop event from bubbling
			evt = evt||event; /* get IE event ( not passed ) */
			evt.stopPropagation? evt.stopPropagation() : evt.cancelBubble = true;
		}
	};

	var _paintBalls = function(){
		for (i = 0; i < balls.length; i++) {
			_paintBall(balls[i]);
		}
	};

	var _paintBall = function(ballJSON){
		var video = _getCurrentEVideo();
		var segmentDiv = $(V.Slides.getCurrentSlide()).find(".segmentDiv");
		var ball = document.createElement('li');
		var marker = document.createElement('div');
		var segments = 	$(V.Slides.getCurrentSlide()).find(".evideoSegments");
		var position = $(V.Slides.getCurrentSlide()).find(".evideoProgressBar");
		$(segmentDiv).append(marker);
		$(segments).append(ball);
		marker.className = 'evideoMarker';
		ball.className = 'evideoBall';
		var time = parseFloat(ballJSON.time);
	   	var duration = parseFloat(video.duration);
	   	var bar_width = $(V.Slides.getCurrentSlide()).find(".evideoProgressBar").width();

	   	var perc = bar_width / duration;
	   	ball.style.left = ((Math.round((bar_width*time/video.duration) - 10 ) * 100)/($(segments).width()))  + 0.42 + "%"; //we add 8 to adjust the ball
	   	marker.style.left =((Math.round((bar_width*time/video.duration)) * 100)/($(position).width())) + 0.2 + "%";
	   	ball.onclick = function () {
			video.currentTime = time;
			_popUp(_onCloseSubslide,ballJSON);
		}
	};

	var _eraseBalls = function(){
		$(V.Slides.getCurrentSlide()).find(".segmentDiv").html('');
		$(V.Slides.getCurrentSlide()).find(".evideoSegments").html('');
	};



	var _generateWrapper = function(videoId){
			var video_embedded = "http://www.youtube.com/embed/"+videoId;
			current_area=  $(V.Slides.getCurrentSlide()).find(".evideoBody");
			var width_height = V.Utils.dimentionsToDraw($(".evideoBody").width(), $(".evideoBody").height(), 325, 243 );    
			var wrapper = "<iframe src='"+video_embedded+"?wmode=opaque' frameborder='0' style='width:"+width_height.width+ "px; height:"+ width_height.height+ "px;'></iframe>";
			return wrapper;
	};
	 
	var generateWrapperForYoutubeVideoUrl = function (url){
			var videoId = V.Video.Youtube.getYoutubeIdFromURL(url);
			if(videoId!=null){
				return _generateWrapper(videoId);
			} else {
				return "Youtube Video ID can't be founded."
			}
	};


	// Utils

	var _getCurrentEVideo = function(){
		return $(V.Slides.getCurrentSlide()).find(".evideoBody").children()[0];
	};

	var _getCurrentEVideoBox = function(){
		return $(V.Slides.getCurrentSlide()).find(".evideoBox");
	};

	var _getCurrentEVideoIndexBox = function(){
		return $(V.Slides.getCurrentSlide()).find(".evideoIndexBox");
	};

	var _fomatTime = function(s,sN){
		sN = (typeof sN == "number" ? sN : -1);

		//Get whole hours
		var h = Math.floor(s/3600);
		s -= h*3600;

		//Get remaining minutes
		var m = Math.floor(s/60); 
		s -= m*60;
		s = Math.round(s);

		return ((h<1 && sN<5) ? '' : h + ":") + ((sN>3) ? '0'+m : m) + ":" + (s < 10 ? '0'+s : s);
	};

	return {
		init			: init,
		drawEVideo		: drawEVideo,
		loadEVideo		: loadEVideo,
		unloadEVideo	: unloadEVideo,
		aftersetupSize	: aftersetupSize
	};

}) (VISH, jQuery);