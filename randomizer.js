Qualtrics.SurveyEngine.addOnload(function() {
  // URLs for player list, player photos, and vignette templates
  const playersUrl = "https://raw.githubusercontent.com/wpmarble/soccer-survey/main/player-list.csv";
  const photoDirUrl = "https://raw.githubusercontent.com/wpmarble/soccer-survey/main/photos";
  const vignetteDirUrl = "https://raw.githubusercontent.com/wpmarble/soccer-survey/main/vignettes";

  // Function to parse CSV text into an array of player objects
  function parseCSV(data) {
    const lines = data.trim().split("\n");
    const headers = lines[0].split(",");
    return lines.slice(1).map(line => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = values[i] ? values[i].trim() : "";
      });
      return obj;
    });
  }

  // Helper function to randomly select an item from an array
  function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Randomly assign treatment groups: nationality, race, and sentiment
  const tr_british = Math.round(Math.random()); // 0 = non-British, 1 = British
  const tr_white = Math.round(Math.random());   // 0 = non-White, 1 = White
  const sentiment_options = ["positive", "negative", "neutral"];
  const tr_sentiment = randomChoice(sentiment_options); // Randomly pick sentiment

  // Load player list
  fetch(playersUrl)
    .then(response => response.text())
    .then(text => {
      // Parse players
      const players = parseCSV(text);
      console.log("players:\n", players);

      // Filter players matching treatment group
      const eligiblePlayers = players.filter(player => {
        const britishOk = (tr_british == 1) ? (player.british == "1") : (player.british == "0");
        const whiteOk = (tr_white == 1) ? (player.black_white == "White") : (player.black_white != "White");
        return britishOk && whiteOk;
      });

      let selectedPlayer;

      // Randomly select from eligible players, or fallback to any player
      if (eligiblePlayers.length > 0) {
        selectedPlayer = randomChoice(eligiblePlayers);
      } else {
        console.warn("No eligible players for assigned treatment. Randomly selecting from all players instead.");
        selectedPlayer = randomChoice(players);
      }

      

      // Extract player information
      const fullName = selectedPlayer.name;
      const lastName = selectedPlayer.photo_name;
      const team = selectedPlayer.team;
      const position = selectedPlayer.position;

      // Map detailed position (GK, DEF, MID, etc.) to broad categories
      let positionGroup = "";
      if (position == "GK") {
        positionGroup = "gk";
      } else if (position == "DEF") {
        positionGroup = "def";
      } else if (position == "MID") {
        positionGroup = "mid";
      } else {
        positionGroup = "attack"; // Assume attacker otherwise
      }
      

      // Build photo filename and URL
      const photoFilename = lastName.toLowerCase() + "-" + tr_sentiment + ".jpg";
      const photoUrl = photoDirUrl + "/" + photoFilename;

      // Build vignette filename and URL
      // const vignetteFilename = `${positionGroup}-${tr_sentiment}.txt`;
      // const vignetteUrl = `${vignetteDirUrl}/${vignetteFilename}`;
      const vignetteFilename = positionGroup + "-" + tr_sentiment + ".txt";
      const vignetteUrl = vignetteDirUrl + "/" + vignetteFilename;


      // Fetch vignette text
      fetch(vignetteUrl)
        .then(response => response.text())
        .then(vignetteTemplate => {
          // Replace placeholder tags in the vignette template
          const vignetteText = vignetteTemplate
            .replace(/\[player name\]/gi, fullName) // Case-insensitive replace
            .replace(/\[club name\]/gi, team);

          // Save customized vignette to Embedded Data
          Qualtrics.SurveyEngine.setEmbeddedData('vignette_text', vignetteText);

          // Optionally display the vignette and photo immediately on the page
          const vignetteDiv = document.getElementById('vignette');
          if (vignetteDiv) {
            vignetteDiv.innerHTML = 
              '<div style="text-align:left; padding:10px;">' +
              '<img src="' + photoUrl + 
              '" alt="Player photo" style="max-width:80%; height:auto; display:block; margin:10px auto 0 auto;">' +
              '<br>' +
              vignetteText +
              '</div>';          
            }
          console.log("vignetteText:", vignetteText);
        })
        .catch(error => {
          console.error("Failed to load vignette file:", error);
        });

      // Log variables
      console.log("tr_british: ", tr_british)
      console.log("tr_white: ", tr_white)
      console.log("tr_sentiment: ", tr_sentiment)
      console.log("positionGroup:\n", positionGroup);
      console.log("tr_sentiment:\n", tr_sentiment);
      console.log("selectedPlayer:\n", selectedPlayer);
      console.log("lastName: ", lastName)
      console.log("photoFilename: ", photoFilename);
      console.log("photoUrl: ", photoUrl);

      console.log("fullName:\n", fullName);
      console.log("positionGroup:\n", positionGroup);
      console.log("vignetteDirUrl:\n", vignetteDirUrl);
      console.log("vignetteFilename:\n", vignetteFilename);
      console.log("vignetteFilename:", vignetteFilename);
      console.log("vignetteUrl:", vignetteUrl);

      // Save player attributes and treatment assignment to Embedded Data
      Qualtrics.SurveyEngine.setEmbeddedData('tr_british', tr_british);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_white', tr_white);
      Qualtrics.SurveyEngine.setEmbeddedData('tr_sentiment', tr_sentiment);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_name', fullName);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_team', team);
      Qualtrics.SurveyEngine.setEmbeddedData('selected_player_position_group', positionGroup);
      Qualtrics.SurveyEngine.setEmbeddedData('photo_url', photoUrl);
    })
    .catch(error => {
      console.error("Failed to load players file:", error);
    });

});