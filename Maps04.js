import misBarras4 from './rooms.js'

const map = L.map('map').setView([40.416934, -3.703805],10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);


//Cargamos los datos a través de un fichero generado por nosotros con todos los datos
//para generar un polígono. El formato cumple el estandard geoJson
d3.json('./Data/distritos.geojson')
    .then((distritos) => {
        printMap(distritos)   
    });


function printMap(distritos){
    
    //Cargamos los datos de Airbnb desde el fichero facilitado en el curso
    //Y sólo nos traemos los campos necesarios para nuestro trabajo
    d3.dsv(";","./Data/airbnb.csv", function(d) {
        return {
          city : d.City,
          zipcode :  d.Zipcode,
          price : +d.Price,
          propertyType : d.Property_Type,
          Square_Feet : +d.Square_Feet,
          bedrooms : +d.Bedrooms,
          Reviews : +d.Number_of_Reviews,
          barrio : d.Neighbourhood_Group_Cleansed
        };
      }).then(function(data) {
        var geojson;
        //Filtramos los datos para traernos sólo lo necesario para procesar los datos de Madrid
        const large_land = data.filter(function(d) { return ((d.city === "Madrid" || d.city === "Centro, Madrid" || d.city === "Delicias-Madrid"
        || d.city === "Madri" || d.city === "madrid" || d.city === "MADRID" || d.city === "Madrid, Vallecas (Fontarrón)") 
        && d.price > 0 && d.zipcode !== "" 
        && d.barrio !=="") });
          
        //Hacemos pruebas de verificación de que los datos son los que queremos  
        
        //Actuamos sobre los datos de Airbnb para agruparlos por barrios y hacer los cáculos de
        //Suma de reviews y la media de precio

          var expenseMetrics = d3.nest()
          .key(function(d) { return d.barrio; })
          .rollup(function(v) { return {
            count: v.length,
            totalVisitas: d3.sum(v, function(d) { return d.Reviews; }),
            precioMedio: +d3.mean(v, function(d) { return d.price; }).toFixed(2)
          }; })
          .entries(large_land);

        //Una vez obtenidos los datos del geoJson y filtrados y agrupados los de Airbnb, pasamos a fusionar los dos datasets expenseMetrics y distritos
        
        distritos.features.forEach(function(distritosF){   
            var result = expenseMetrics.filter(function(expenseMetric){
            return expenseMetric.key === distritosF.properties.nombre
         });
        
        // //Creamos una variable en blanco para utilizarla en el supuesto de valores nulos
            const valueNull = {count: 0, totalVisitas: 0, precioMedio: 0}
            distritosF.properties.value = (result[0] !== undefined) ? result[0].value : valueNull;
         });

        //Asignamos el Dataset al mapa con todos los datos necesarios y con los estilos de colores, según su valor

        geojson = L.geoJson(distritos, {style: style,onEachFeature: onEachFeature}).addTo(map);

        //Añadiendo interacción
        var info = L.control();

        info.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
          this.update();
          return this._div;
        };
        
        // Actualizamos la información de la leyenda de los barrios
        //Según nos situemos encima de cada barrio, en la leyenda se mostrarán los datos de la misma
       var miBarrio = "Centro"
        info.update = function (props) {
          this._div.innerHTML = '<h4>Info Barrio</h4>' +  (props ?
            '<b>' + props.nombre + '</b><br />' +
            '<b>Precio medio: ' + props.value.precioMedio + '€</b>' +
            '<br />Total disponibles: ' + props.value.count +
            '<br />Total reviews: ' + props.value.totalVisitas +
            '</sup>' 
             : 'Pase el ratón sobre el Barrio');
            miBarrio =  (props ? props.nombre : 'Centro');
        };
    
        info.addTo(map);
        
       geojson = L.geoJson(distritos, {
        style: style,
        onEachFeature: onEachFeature
      }).addTo(map);
      
      function highlightFeature(e) {
        var layer = e.target;
        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7});

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
        info.update(layer.feature.properties);
                
    }
    
    function resetHighlight(e) {
        geojson.resetStyle(e.target);
        info.update();
    }
    function onEachFeature(feature, layer) {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click : onMapClick
        });
    }      
    
    function onMapClick(e) {
        var layer = e.target;
        info.update(layer.feature.properties);
       alert(`Has pulsado en: ${e.latlng}  perteneciente al barrio de ${miBarrio}`);
       //Hacemos la llamada a rooms para actualizar la representación grafica del barrio pulsado
       misBarras4(miBarrio,large_land);
    }
    // Fin Adding interaccion
    });
//Fin printMap()
    
}

//Definimos las funciones para asignar los colores segun su precio medio/barrio
function getColor(d) {

	return d > 150 ?  '#800026' :
	       d > 120 ?  '#BD0026' :
	       d > 100 ?  '#E31A1C' :
	       d > 80  ?  '#FC4E2A' :
	       d > 70  ?  '#FD8D3C' :
	       d > 60  ?  '#FEB24C' :
	       d > 50  ?  '#FED976' :
                       '#FFEDA0' ;
}

//Style
function style(feature) {
       return {
           fillColor: getColor(feature.properties.value.precioMedio),
           weight: 2,
           opacity: 1,
           color: 'white',
           dashArray: '3',
           fillOpacity: 0.7    
       };
   }

//Leyenda de colores customizada
var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

	var div = L.DomUtil.create('div', 'info legend'),
		grades = [50, 60, 70, 80, 100, 120, 150],
        labels = ['50-60','60-70' ,'70-80' , '80-100', '100-120','120-150' ,'150+'];

    // Generamos un color para cada una de las leyendas según se han pintado en el mapa
	for (var i = 0; i < grades.length; i++) {
		div.innerHTML +=
			'<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
			labels[i] + '<br><br>';
	}
	return div;
};

legend.addTo(map);

//Final custom control leyenda


