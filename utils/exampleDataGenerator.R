# Number of random observations per class
n = 250 

# random coordinates
y <- round(runif(n*3, 36, 44), 3)
x <- round(runif(n*3, -10, 3.5), 3)

# 3 different classes
cl <- rep(c("Class1", "Class2", "Class3"), each=n)

# Different species for each class
sp1 <- sample(paste0("sp", LETTERS[1:5]), n, replace=T)
sp2 <- sample(paste0("sp", LETTERS[6:10]), n, replace=T)
sp3 <- sample(paste0("sp", LETTERS[11:15]), n, replace=T)

# Random values for first class, than all with 1
value <- c(sample(1:4, n, replace=TRUE), rep(1, n*2))

# Merge and write data
species <- data.frame(id=1:(n*3), class=cl, sciname=c(sp1, sp2, sp3), 
                      lat=y, lon=x, value=value)

#Modifiy species spC in Class1 to have no extra value
species[species$sciname=="spC", "value"] <- 1

write.csv(species, "example_data.csv", quote=FALSE)
