library(sf)


csvname <- "example_data.csv"
gridfile <- "../grid.geojson"
crdnames <- c("lon", "lat")
fieldnames <- c("class", "sciname", "value")


spData <- read.csv(csvname)
spData.geo <- st_as_sf(spData, coords = crdnames)
grd <- st_read(gridfile)
grd <- st_transform(grd, crs=4326)
st_crs(spData.geo) <- st_crs(grd)

i <- sapply(st_intersects(spData.geo, grd), function(z) ifelse(length(z)==0, NA_integer_, z[1]))
ref <- as.data.frame(grd)[i, "grdref"]

results <- data.frame(Class=spData[,fieldnames[1]], Name=spData[,fieldnames[2]],
                      ref=ref, value=spData[,fieldnames[3]])

results <- results[!is.na(results$ref),]

results <- unique(results)

write.csv(results, "species.csv", quote=F, row.names=F)

