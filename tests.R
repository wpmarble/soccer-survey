# some tests to make sure the files are set up correctly

library(tidyverse)
library(rlang)
setwd("~/dropbox/Fantasy_PL/survey/public-survey-files/")

players <- read.csv("player-list.csv")


# ensure photo file names correct -----------------------------------------

# make sure they match the players$photo_name
photos <- strsplit(list.files("photos/"), "-") %>% 
  map(1) %>% 
  unlist() %>% 
  unique()

# should be character(0) for both
setdiff(players$photo_name, photos)
setdiff(photos, players$photo_name)
