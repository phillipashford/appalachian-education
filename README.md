# Mapping Educational Levels by County with 2020 US Census Data

Explore my interactive web map on Education in Appalachia! You will find information and maps showing the educational attainment of the populations of the counties in the region.

After gathering educational data from the US Census API and storing it in csv format, I used QGIS to join the csv data to a US Census counties shapefile, and then selected for counties that were only in Appalachia (per the Appalachian Regional Commission (ARC)). I then exported the data as a geoJSON which I then mapped with Leaflet.js, a popular interactive JavaScript mapping library. 

The web map is designed to be user-friendly and interactive. You can use the dropdown menu to choose different educational attainment levels to display on the map. The legend will update to show the color codes and corresponding values for each level of education.

I hope you find the map informative and helpful! 
 
 Check it out [here](https://phillipashford.github.io/appalachian-education/)!
 
 ## Data Sources
 Education data via the [US Census API](https://api.census.gov/data/2020/acs/acs5/profile?get=NAME,DP02_0059E,DP02_0062E,DP02_0065E,DP02_0066E&for=county)
 
 County data via the [Appalachian Regional Commission](https://www.arc.gov/wp-content/uploads/2021/11/Appalachian-Counties-Served-by-ARC_2021.xlsx)
