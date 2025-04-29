# some tests to make sure the files are set up correctly

library(tidyverse)
library(assertthat)
setwd("~/dropbox/Fantasy_PL/survey/public-survey-files/")

players <- read.csv("player-list.csv")


# ensure photo file names correct -----------------------------------------

# make sure they match the players$photo_name
photos <- strsplit(list.files("photos/"), "-") %>% 
  map(1) %>% 
  unlist() %>% 
  unique()

# should be character(0) for both, but ok if more photos than players
(s1 <- setdiff(players$photo_name, photos))
(s2 <- setdiff(photos, players$photo_name))
assert_that(length(s1) == 0) 




# ensure players satisfy all factorial cells ------------------------------


(c1 <- (with(players, table(british, neurope, useNA="if"))))
assert_that(all(c1 > 0))
