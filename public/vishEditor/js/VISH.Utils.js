VISH.Utils = (function(V,undefined){
	
	var domIds;
	// myDomId = domIds['prefix'] returns a unicId for the specified prefix

	var init = function(){
		if(!domIds){
			domIds = new Array();
		}
	}

   /**
	* Return a unic id.
	* full_id_prefix: Specify a prefix for the id, for example, article to get "article_x" ids.
	* Specify a separator for nested ids.
	* justCheck: only check if the id is really unic, if dont generate a new id.
	*/
	var getId = function(full_id_prefix,justCheck,separator){
		if(!justCheck){
			if(typeof full_id_prefix !== "string"){
				//Default prefix
				full_id_prefix = "unicID";
			}

			if(typeof separator !== "string"){
				separator = "";
			}

			if(typeof domIds[full_id_prefix] === "undefined"){
				domIds[full_id_prefix] = 0;
			}
			domIds[full_id_prefix] = domIds[full_id_prefix] + 1;
			var full_id = full_id_prefix + separator + domIds[full_id_prefix];
		} else {
			var full_id = full_id_prefix;
			full_id_prefix = full_id_prefix.replace(full_id_prefix[full_id_prefix.length-1],"");
		}

		//Ensure that the id is unic.
		if($("#"+full_id).length===0){
			return full_id;
		} else {
			return getId(full_id_prefix,false,separator);
		}
	};

	var getOuterHTML = function(tag){
		//In some old browsers (before firefox 11 for example) outerHTML does not work
		//Trick to provide full browser support
		if (typeof($(tag)[0].outerHTML)=='undefined'){
			return $(tag).clone().wrap('<div></div>').parent().html();
		} else {
			return $(tag)[0].outerHTML;
		}
	}

	var loadDeviceCSS = function(){
		//Set device CSS
		if(VISH.Status.getDevice().desktop){
			loadCSS("device/desktop.css");
		} else if(VISH.Status.getDevice().mobile){
			loadCSS("device/mobile.css");
		} else if(VISH.Status.getDevice().tablet){
			loadCSS("device/tablet.css");
		}

		//Set browser CSS
		switch(VISH.Status.getDevice().browser.name){
			case VISH.Constant.FIREFOX:
				loadCSS("browser/firefox.css");
				break;
			case VISH.Constant.IE:
				loadCSS("browser/ie.css");
				break;
			case VISH.Constant.CHROME:
				loadCSS("browser/chrome.css");
				break;
		}
	}

	/*
	 * function to send the parent to the specified URL, used for fullscreen
	 */
	var sendParentToURL = function(the_url){
		window.parent.location = the_url;
	};

   /**
	* Function to dinamically add a css
	*/
	var loadCSS = function(path){
		$("head").append('<link rel="stylesheet" href="' + VISH.StylesheetsPath + path + '" type="text/css" />');
	};

		
	//Check minium requirements to init vish editor
	var checkMiniumRequirements = function(){
		var browserRequirements = true;
		var device = VISH.Status.getDevice();

		switch(device.browser.name){
			case VISH.Constant.IE:
				if(VISH.Editing){
					if(device.browser.version < 9){
						browserRequirements = false;
					}
				} else {
					if(device.browser.version < 8){
						browserRequirements = false;
					}
				}
				break;
			case VISH.Constant.FIREFOX:
				break;
			case VISH.Constant.CHROME:
				break;
			default:
				//Allow...
			break;
		}
				
		if(!browserRequirements){
			$.fancybox(
				$("#requirements_form_wrapper").html(),
				{
					'autoDimensions'  : false,
					'width'           : 650,
					'height'          : 400,
					'showCloseButton' : false,
					'padding'       : 0,
					'onClosed'      : function(){
						//Do nothing!
					}
				}
			);
			return false;
		}

		return true;
	}
		

	/*
	* In the css we have url("image_path") and to use ir in an image src attribute we need to get the image_path
	* this function does that
	*/
	var getSrcFromCSS = function(css){
		if(css.indexOf("url") === 0){
			return css.substring(4,css.length-1);
		} else {
			return css;
		}
	}

	var getZoomInStyle = function(zoom){
		var style = "";
		style = style + "-ms-transform: scale(" + zoom + "); ";
		style = style + "-ms-transform-origin: 0 0; ";
		style = style + "-moz-transform: scale(" + zoom + "); ";
		style = style + "-moz-transform-origin: 0 0; ";
		style = style + "-o-transform: scale(" + zoom + "); ";
		style = style + "-o-transform-origin: 0 0; ";
		style = style + "-webkit-transform: scale(" + zoom + "); ";
		style = style + "-webkit-transform-origin: 0 0; ";
		return style;
	}

	var getZoomFromStyle = function(style){
		var zoom = 1; //Initial or default zoom
		
		if(!style){
			return zoom;
		}
		
		//Patterns
		var moz_zoom_pattern = /-moz-transform: ?scale\(([0-9]+.[0-9]+)\)/g
		var webkit_zoom_pattern = /-webkit-transform: ?scale\(([0-9]+.[0-9]+)\)/g
		var opera_zoom_pattern = /-o-transform: ?scale\(([0-9]+.[0-9]+)\)/g
		var ie_zoom_pattern = /-ms-transform: ?scale\(([0-9]+.[0-9]+)\)/g

		
	    $.each(style.split(";"), function(index, property){
				 
		     if (property.match(moz_zoom_pattern) != null) {
				 	//Mozilla Firefox
			   	var result = moz_zoom_pattern.exec(property);
			   	if (result[1]) {
			   		zoom = parseFloat(result[1]);
			   		return false;
			   	}
			   } else if (property.match(webkit_zoom_pattern)!=null) {
				 	  //Google Chrome
	          var result = webkit_zoom_pattern.exec(property);
	          if(result[1]){
	            zoom = parseFloat(result[1]);
	            return false;
	          }
		     } else if (property.match(opera_zoom_pattern)!=null) {
				 	  //Opera
	          var result = opera_zoom_pattern.exec(property);
	          if(result[1]){
	            zoom = parseFloat(result[1]);
	            return false;
	          }
				 } else if (property.match(ie_zoom_pattern)!=null) {
				 	  //Iexplorer
	          var result = ie_zoom_pattern.exec(property);
	          if(result[1]){
	            zoom = parseFloat(result[1]);
	            return false;
	          }
	       }
	    });
		
    return zoom;
   };


   /////////////////////////
	/// Fancy Box Functions
	/////////////////////////

	/**
	 * function to load a tab and its content in the fancybox
	 * also changes the help button to show the correct help
	 */
	var loadTab = function (tab_id){
		// first remove the walkthrough if open
		$('.joyride-close-tip').click();
		//hide previous tab
		$(".fancy_tab_content").hide();
		//show content
		$("#" + tab_id + "_content").show();
		//deselect all of them
		$(".fancy_tab").removeClass("fancy_selected");
		//select the correct one
		$("#" + tab_id).addClass("fancy_selected");
		//hide previous help button
		$(".help_in_fancybox").hide();
		//show correct one
		$("#"+ tab_id + "_help").show();

        //Submodule callbacks	
		switch (tab_id) {
			//templates and flashcards
			case "tab_templates":
				break;
			case "tab_flashcards_repo":
				V.Editor.Flashcard.Repository.onLoadTab();
				break;
			//Image
			case "tab_pic_from_url":
				V.Editor.Image.onLoadTab("url");
				break;
			case "tab_pic_upload":
				V.Editor.Image.onLoadTab("upload");
				break;
			case "tab_pic_repo":
				V.Editor.Image.Repository.onLoadTab();
				break;
			case "tab_pic_flikr":
				V.Editor.Image.Flikr.onLoadTab();
				break;
			//Video
			case "tab_video_from_url":
				VISH.Editor.Video.onLoadTab();
				break;
			case "tab_video_repo":
				VISH.Editor.Video.Repository.onLoadTab();
				break;
			case "tab_video_youtube":
				VISH.Editor.Video.Youtube.onLoadTab();
				break;
			case "tab_video_vimeo":
				VISH.Editor.Video.Vimeo.onLoadTab();
				break;
				
			//Objects
			case "tab_object_from_url":
				VISH.Editor.Object.onLoadTab("url");
				break;
			case "tab_object_from_web":
				VISH.Editor.Object.Web.onLoadTab();
				break;
			case "tab_object_snapshot":
				VISH.Editor.Object.Snapshot.onLoadTab();
				break;
			case "tab_object_upload":
				VISH.Editor.Object.onLoadTab("upload");
				break;
			case "tab_object_repo":
				VISH.Editor.Object.Repository.onLoadTab();
				break;
				
			//Live
			case "tab_live_webcam":
				VISH.Editor.Object.Live.onLoadTab("webcam");
				break;
			case "tab_live_micro":
				VISH.Editor.Object.Live.onLoadTab("micro");
				break;
			//quizzes
			case "tab_quiz_session":
				VISH.Quiz.activatePolling(false);
				break;
			case "tab_quiz_stats_bars":
				VISH.Quiz.activatePolling(true);
				break;
			case "tab_quiz_stats_pie":
				VISH.Quiz.activatePolling(true);
				break;
 			//Default
			default:
				break;
	  }
	};


	var getFontSizeFromStyle = function(style){
		if(!style){
			return;
		}

		var font_style_pattern = /font-size:\s?([0-9]+)px/g;
		var ft = null;
	    $.each(style.split(";"), function(index, property){
		     if (property.match(font_style_pattern) != null) {
			   	var result = font_style_pattern.exec(property);
			   	if (result[1]) {
			   		ft = parseFloat(result[1]);
			   		return false;
			   	}
			 }
		});
		return ft;
	}

	var addFontSizeToStyle = function(style,fontSize){
		if(typeof style !== "string"){
			return null;
		}

		var filterStyle = "";
		$.each(style.split(";"), function(index, property){
			if ((property.indexOf("font-size") === -1)&&(property!=="")) {
				filterStyle = filterStyle + property + "; ";
			}
		});
				
		if(fontSize){
			filterStyle = filterStyle + "font-size:"+fontSize+";";
		}

		return filterStyle;
	}

	var removeFontSizeInStyle = function(style){
		if(typeof style !== "string"){
			return null;
		}

		var filterStyle = "";
		$.each(style.split(";"), function(index, property){
			if ((property.indexOf("font-size") === -1)&&(property!=="")) {
				filterStyle = filterStyle + property + "; ";
			}
		});

		return filterStyle;
	}

   return {
		init 					: init,
		getId					: getId,
		getOuterHTML 			: getOuterHTML,
		getSrcFromCSS			: getSrcFromCSS,
		loadDeviceCSS			: loadDeviceCSS,
		loadCSS					: loadCSS,
		checkMiniumRequirements : checkMiniumRequirements,
		addFontSizeToStyle 		: addFontSizeToStyle,
		removeFontSizeInStyle 	: removeFontSizeInStyle,
		getFontSizeFromStyle 	: getFontSizeFromStyle,
		getZoomFromStyle 		: getZoomFromStyle,
		getZoomInStyle    		: getZoomInStyle,
		loadTab 				: loadTab,
		sendParentToURL			: sendParentToURL
   };

}) (VISH);