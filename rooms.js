import misBarrios from './functions.js';

//Creamos una variabel global, para poder hacer interactivo el cambio de barrio.
//Por defecto en la carga inicial asignaremos el barrio Centro 
var filtroBarrio = "Centro"

/////////////////////// Principio ///////////////////////////
//Creamos la base de nuestros elementos y posteriormente la terminaremos de definir, para ofrecer una página dinámica
// set the dimensions and margins of the graph
 var margin = {top: 30, right: 40, bottom: 30, left: 40},
 width = 450 - margin.left - margin.right,
 height = 400 - margin.top - margin.bottom;
 
 // append the svg object to the body of the page
 var svg = d3.select('#prueba')
 .append("svg")
 .attr("width", width + margin.left + margin.right)
 .attr("height", height + margin.top + margin.bottom)
 // translate this svg element to leave some margin.
 .append("g")
 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 
 var miTexto = svg
  .append("text")
  .attr("x", ((width + margin.left + margin.right)/ 2))             
  .attr("y", 0 - (margin.top / 2))
  .attr("text-anchor", "middle")  
  .style("font-size", "16px") 
  .style("text-decoration", "underline")  
  

 // X axis
 var x = d3.scaleBand()
   .range([ 0, width ])
   .padding(0.2);
 
 var xAxis = svg.append("g")
   .attr("transform", "translate(0," + height + ")")
   
 // Y scale and Axis
 var y = d3.scaleLinear()
 .range([height, 0]);  
 
 var yAxis = svg
 .append('g')
 .attr("class", "myYaxis")

 //Creamos la base de nuestro Tooltip
var Tooltip = d3.select('#prueba')
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")

//////////////Final carga componentes///////////////////////

//Creamos una función que será visible desde otros .js (Maps04.js) para poder actualizar la representación de datos
// según el barrio filtrado. Esta función recibe por parametro el barrio filtrado y los datos eque se ha utilizado para pintar el mapa
function misBarras4(filtro, data02) {
  filtroBarrio = filtro;

//Actuamos sobre los datos de Airbnb para agruparlos por barrios y hacer los cáculos de
  var expenseMetrics02 = d3.nest()
  .key(function(d) { return d.barrio })
  .key(function(d) { return d.bedrooms })
  .rollup(function(v) { return v.length
   })
  .entries(data02);

const barrio02 = expenseMetrics02.filter(function(d) { return d.key === filtroBarrio; });

var rangoBarrio02 = d3.max(barrio02, d => d.values)
const valorTotRooms02 = misBarrios(rangoBarrio02)

//Procedemos a la ordenación de habitaciones de los inmuebles
const rangoBarrioSort02 = rangoBarrio02.sort(function(a,b) {
  return a.key - b.key;
});

//Llamamos a la función que nos pintará o actualizará nuestro chart
// los datos necesarios, los hemos traido del mapa
drawChart(rangoBarrioSort02,valorTotRooms02)

}

//En la carga inicial de la página, recuperamos los datos del fichero de Aibnb directamente
//Y nos traemos los campos que necesitamos
d3.dsv(";","./Data/airbnb.csv", function(d) {
    return {
      city : d.City,
      zipcode :  d.Zipcode,
      price : +d.Price,
      propertyType : d.Property_Type,
      Square_Feet : +d.Square_Feet,
      bedrooms : +d.Bedrooms,
      barrio : d.Neighbourhood_Group_Cleansed
    };
  }).then(function(data) {
    
    //Filtramos los datos para traernos sólo lo necesario para procesar los datos de Madrid
    var large_land = data.filter(function(d) { return ((d.city === "Madrid" || d.city === "Centro, Madrid" || d.city === "Delicias-Madrid"
    || d.city === "Madri" || d.city === "madrid" || d.city === "MADRID" || d.city === "Madrid, Vallecas (Fontarrón)") 
    && d.price > 0 && d.zipcode !== "" 
    && d.Square_Feet > 6 && d.barrio !=="") });    
  
    //Actuamos sobre los datos de Airbnb para agruparlos por barrios y hacer los cáculos necesarios
      var expenseMetrics = d3.nest()
      .key(function(d) { return d.barrio; })
      .key(function(d) { return d.bedrooms; })
      .rollup(function(v) { return v.length;
       })
      .entries(large_land);

    const barrio = expenseMetrics.filter(function(d) { return d.key === filtroBarrio; });
    var rangoBarrio = d3.max(barrio, d => d.values)

    const valorTotRooms = misBarrios(rangoBarrio)

    const rangoBarrioSort = rangoBarrio.sort(function(a,b) {
      return a.key - b.key;
    });
  
    //Llamamos a la función que nos representará nuestra gráfica
  drawChart(rangoBarrioSort,valorTotRooms)
});

function drawChart(data, dominio) {
  // Update the X axis
  x.domain(data.map(function(d) { return d.key; }))
  xAxis.call(d3.axisBottom(x))

  // Update the Y axis
  y.domain(dominio);
  yAxis.transition().duration(1000).call(d3.axisLeft(y));
//Creamos un título para nuestro chart y este será dinámico para mostrarnos los datos a que barrio pertenecen
  miTexto
  .text(`Número Props/Rooms del barrio de ${filtroBarrio}`)

  // Create the u variable
  var u = svg.selectAll("rect")
    .data(data)

    u
      .enter()
      .append("rect") // Añadimos una nueva barra para cada elemento
      .merge(u) 
      .attr("x", function(d) { return x(d.key); })
      .attr("y", function(d) { return y(d.value); })
      .attr("width", x.bandwidth())
      .attr("height", function(d) { return height - y(d.value); })
      .attr("fill", "#69b3a2")
      .on("mouseover", handleMouseOver)
      .on("mouseout", handleMouseOut)
      .on("mousemove", mousemove )
      .on("mouseleave", mouseleave );
    
      u
      .transition() // Aplicamos cambios
      .duration(1000)

  // If less group in the new dataset, I delete the ones not in use anymore
  u
    .exit()
    .remove()

    function handleMouseOver(d, i) {  // Añadimos interactividad
      Tooltip
      .style("opacity", 1)
      .html(`Barrio de ${filtroBarrio} <br> De ${data[i].key} habitaciones hay: ${data[i].value}`)
    
      d3.select(this)
      .style("stroke", "black")
      .style("opacity", 1)      
      }
      
      function handleMouseOut(d, i) {
        // Volvemos al color y estado de la barra original
        d3.select(this)
          .attr("fill", "#69b3a2");
       
      }
      
      function mousemove(d, i) {
        //Funciona fuera de nuestro lienzo y ahora se visualiza debajo del div
        Tooltip
        .style("left", (d3.mouse(this)[0]+90) + "px")
        .style("top", (d3.mouse(this)[1]) + "px")
      }
      
     function mouseleave(d, i) {
        console.log('Leave')
        Tooltip
      .style("opacity", 0)
    d3.select(this)
      .style("stroke", "none")
      .style("opacity", 0.8)
      }

}
 
 export default misBarras4