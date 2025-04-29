Qualtrics.SurveyEngine.addOnload(function() {

  /*
    This block dynamically constructs and displays the vignette
    using the respondent's randomized treatment assignment.
    It fetches the vignette text and player photo, fills in player-specific details,
    and displays them cleanly in the survey.
    It also stores the final customized vignette text into Embedded Data.
  */
    // --- Hide the Next button for 10 seconds ---
  this.hideNextButton();
  setTimeout(() => {
    this.showNextButton();
  }, 10000);

  // --- Base URLs for accessing photo files and vignette templates ---
  const photoDirUrl = "https://wpmarble.github.io/soccer-survey/photos";
  const vignetteDirUrl = "https://wpmarble.github.io/soccer-survey/vignettes";

  // --- Read treatment assignment and player attributes from Embedded Data ---
  const positionGroup = "${e://Field/selected_player_position_group}"; // e.g., "attack", "mid", "def", "gk"
  const sentiment = "${e://Field/tr_sentiment}";                       // e.g., "positive", "negative"
  const lastName = "${e://Field/selected_player_photo_name}";           // photo filename uses this
  const fullName = "${e://Field/selected_player_name}";                 // full player name for vignette text
  const teamName = "${e://Field/selected_player_team}";                 // club name for vignette text

  // --- Construct filenames for the vignette template and player photo ---
  const vignetteFilename = positionGroup + "-" + sentiment + ".txt";   // e.g., "attack-positive.txt"
  const vignetteUrl = vignetteDirUrl + "/" + vignetteFilename;         // full URL to vignette template

  const photoFilename = lastName.toLowerCase() + "-" + sentiment + ".jpg"; // e.g., "rashford-positive.jpg"
  const photoUrl = photoDirUrl + "/" + photoFilename;                     // full URL to player photo

  // --- Fetch the vignette text template from the server ---
  fetch(vignetteUrl)
    .then(response => response.text())
    .then(vignetteTemplate => {
      
      // --- Replace placeholder tags with actual player name and club name ---
      const vignetteText = vignetteTemplate
        .replace(/\[player name\]/gi, fullName) // Replace [player name] case-insensitively
        .replace(/\[club name\]/gi, teamName);  // Replace [club name] case-insensitively

      // --- Display the customized vignette + photo inside the survey page ---
      const vignetteDiv = document.getElementById('vignette');
      if (vignetteDiv) {
        vignetteDiv.innerHTML = 
          '<div style="text-align:left; padding:10px;">' +
            '<img src="' + photoUrl + '" alt="Player photo" style="max-width:80%; height:auto; display:block; margin:10px auto 0 auto;">' +
            '<br>' +
            vignetteText +
          '</div>';
      }

      // --- Save the customized vignette text into Embedded Data for later use ---
      Qualtrics.SurveyEngine.setEmbeddedData('vignette_text', vignetteText);

    })
    .catch(error => {
      // --- If the vignette fails to load, show a graceful error message ---
      console.error("Failed to load vignette file:", error);
      const vignetteDiv = document.getElementById('vignette');
      if (vignetteDiv) {
        vignetteDiv.innerHTML = '<p style="color:red;">Failed to load vignette. Please refresh the page.</p>';
      }
    });

});