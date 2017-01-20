$(function() {
	var currentJenkins
	var toggleSlider= $("#jenkinsSlider")

	//-- Set up Slider
	chrome.storage.local.get("APEX_Rally_Jenkins_Enabled_Flag", function (result) {
        currentJenkins = result.APEX_Rally_Jenkins_Enabled_Flag;
        console.log(result.APEX_Rally_Jenkins_Enabled_Flag);
        toggleSlider.prop("checked", currentJenkins);
    	console.log(toggleSlider)
    });

    //-- Slider event listener
    toggleSlider.change(function(){
    	console.log("toggled")
    	chrome.storage.local.set({'APEX_Rally_Jenkins_Enabled_Flag': !currentJenkins}, function() {
          message('Settings saved');
        });

		chrome.storage.local.get("APEX_Rally_Jenkins_Enabled_Flag", function (result) {
	        currentJenkins = result.APEX_Rally_Jenkins_Enabled_Flag;
	        console.log(result.APEX_Rally_Jenkins_Enabled_Flag);
	        $(this).prop("checked", currentJenkins);
	    });

		chrome.tabs.getSelected(null, function(tab) {
		  var code = 'window.location.reload();';
		  chrome.tabs.executeScript(tab.id, {code: code});
		});
    	window.close()
    })
});
