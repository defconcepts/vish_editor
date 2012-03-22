VISH.Editor.Image = (function(V,$,undefined){
	
	var onLoadTab = function(){
		
	}
	
  /**
   * Function to draw an image in a zone of the template
   * the zone to draw is the one in current_area (params['current_el'])
   * this function also adds the slider and makes the image draggable
   */
  var drawImage = function(image_url){
    var template = VISH.Editor.getTemplate();
		var current_area = VISH.Editor.getCurrentArea();

    var nextImageId = VISH.Editor.getId();
    var idToDragAndResize = "draggable" + nextImageId;
    current_area.attr('type','image');
    current_area.html("<img class='"+template+"_image' id='"+idToDragAndResize+"' title='Click to drag' src='"+image_url+"' /><div class='edit_pencil'><img class='edit_pencil_img' src='"+VISH.ImagesPath+"/edit.png'/></div>");
    if(current_area.next().attr('class')==="theslider"){
      //already added slider remove it to add a new one
      current_area.next().remove();
    }
    current_area.after("<div id='sliderId"+nextImageId+"' class='theslider'><input id='imageSlider"+nextImageId+"' type='slider' name='size' value='1' style='display: none; '></div>");      
    
    //position the slider below the div with the image
    var divPos = current_area.position();
    var divHeight = current_area.height();
    $("#sliderId"+nextImageId).css('top', divPos.top + divHeight +10);
    $("#sliderId"+nextImageId).css('left', divPos.left);
    $("#sliderId"+nextImageId).css('margin-left', '12px');
           
    $("#imageSlider"+nextImageId).slider({
      from: 1,
      to: 8,
      step: 0.5,
      round: 1,
      dimension: "x",
      skin: "blue",
      onstatechange: function( value ){
          $("#" + idToDragAndResize).width(325*value);
      }
    });
    $("#" + idToDragAndResize).draggable({cursor: "move"});
  };
	
	return {
		onLoadTab					: onLoadTab,
		drawImage   : drawImage
	};

}) (VISH, jQuery);
