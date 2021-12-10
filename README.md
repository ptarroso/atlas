# Biodiversity Distribution Atlas

This repository is a template to produce a webpage with a Biodiversity Distribution Atlas. The intention of the code is to be simple, configurable and flexible for different groups of organisms whose distribution can be represented on a map.

The user can produce the grid that best suits the data that will be used for the distribution Atlas. Species are grouped by classes and the distribution is shown using the grid cells where the species was observed. The code provided here produces richness maps per class and per grid cell with observation data.

[MAYBE SOME Screenshot?]

A version with example data is available.

# Configuration

## Grid File
The grid should be created as a polygon file, where each grid cell is an individual feature. Most GIS software should provide grid creation tools (for instance, in [QGIS](https://qgis.org), menu Vector -> Research Tools -> Create Grid). 

The grid should be exported in the json format. It **must** have field named **grdref** where a unique code for each grid cell is given. This code can be whatever you like as long as it is unique for each feature (in the example, the grid has a alphanumeric code with letters for rows and numbers for columns). In order to aim to the smallest size possible of the file, remove all other fields. 

The grid must be in a WGS85 geographic coordinate system.

## Species Observation Data

The species observation data is stored in a json file that aims to have the smallest size possible. It is not simple to export the format from a GIS software so some tools are provided to convert from a simple csv file. 

### Observation data with coordinates

If your species data is in coordinates pairs, than some processing should be done before. This can either be done in any GIS software or using a small R script dependent on [sf](https://cran.r-project.org/web/packages/sf/index.html) package. 

The general idea is to intersect your species observation data points with the grid described above. However, you should avoid having repeated and superfluous information that will only increase file size and will not be used. 

After the intersection would should obtain a table with **class**, **species name** and a **value** (see below) from the species observation data and a **grid reference** from the grid file. Although the intersection might provide some geographical feature such as points, only the table is needed and you can export to csv format. To decrease the size, you should remove duplicated lines that the table might have (multiple observations in the same cell). 

The file *intersectSpGrid.R* is a R script that does all of above without the need of a GIS.

### The species data format

The data in the *species.csv* file is organized by grid cell presence (not by coordinates) and is one input to the converter tool. It must have a few mandatory fields:

| class | name | ref | value |
|-------|------|-----|-------|
| Class of the species observed | Species name (typically the scientific name) | the grid cell reference equivalent to **grdref** of the grid file (see above) | a value allowing extra information in the map |

The **value** field allows to display extra symbols in the map associated with each cell observation. It is useful for when you have different levels of observations (e.g. confirmed, not confirmed). On the map it is displayed as circles with radius and colour configurable (see bellow). However, due to the constraints of the map and legend, more than 3 levels are not recommended. Check the example file and webpage for more information.

### The additional information

Some additional information can be associated with each class to be shown in a dedicated box in the webpage. This information is stored in csv format in the file "info.csv" and has two fields:

| class | info |
|-------|------|
| A class present in the species file | The additional info to be displayed |

Note that the additional info supports html notation. Font effects (bold, italics, etc) can be used with the respective html tags but you can also use links and other features. Links may follow the typical tag code:

```
<a href="./extra_info.html"> 
```

and open in a new window. If a class "overlaynote" is specified, than it opens the local html in a overlay window, without leaving the webpage.

```
<a href="./extra_info.html" class="overlaynote">
```

See the example *info.csv* in the *utils* folder for more details.

### Merging and converting data to final format

You can find the converter *csv2json.py* in the utils folder. It is a small python script and you will need [python](www.python.org) installed in your system to be able to run it. If you also have a file named *species.csv* with species data and another *info.csv*, a simple double-click on the script should convert the format and create the *species.json* file needed. (Note: the converter allows changes on the defaults in the command line).
