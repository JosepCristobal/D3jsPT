//Carga de datos inicial
//Creamos una variabel global, para poder hacer interactivo el cambio de barrio.
//Por defecto en la carga inicial asignaremos el barrio Centro 
var filtroBarrio = "Centro"
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
    //   var expenseMetrics = d3.nest()
    //   .key(function(d) { return d.barrio; })
    //   .key(function(d) { return d.bedrooms; })
    //   .rollup(function(v) { return v.length;
    //    })
    //   .entries(large_land);

      const barrio = large_land.filter(function(d) { return d.barrio === filtroBarrio; });  
      console.log(barrio)
    // //const barrio = expenseMetrics.filter(function(d) { return d.key === filtroBarrio; });
    // var rangoBarrio = d3.max(barrio, d => d.values)

    // const valorTotRooms = misBarrios(rangoBarrio)

    // const rangoBarrioSort = rangoBarrio.sort(function(a,b) {
    //   return a.key - b.key;
    // });
 



//Fin carga de datos inicial

var margin = {
    top: 20,
    right: 20,
    bottom: 30,
    left: 40
},
width = 800 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

var x = d3.scaleLinear()
.range([0, width]);

var y = d3.scaleLinear()
.range([height, 0]);


var xAxis = d3.axisBottom(x).tickFormat(function(d){ return d.x;});
var yAxis = d3.axisLeft(y);


var svg = d3.select("#regresion").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var data = create_data(1000);

data.forEach(function(d) {
d.price = +d.price;
d.Square_Feet = +d.Square_Feet;
d.yhat = +d.yhat;
});


var line = d3.line()
.x(function(d) {
    return x(d.x);
})
.y(function(d) {
    return y(d.yhat);
});

x.domain(d3.extent(data, function(d) {
return d.x;
}));
y.domain(d3.extent(data, function(d) {
return d.y;
}));

svg.append("g")
.attr("class", "x axis")
.attr("transform", "translate(0," + height + ")")
.call(xAxis)
.append("text")
.attr("class", "label")
.attr("x", width)
.attr("y", -6)
.style("text-anchor", "end")
.text("X-Value");

svg.append("g")
.attr("class", "y axis")
.call(yAxis)
.append("text")
.attr("class", "label")
.attr("transform", "rotate(-90)")
.attr("y", 6)
.attr("dy", ".71em")
.style("text-anchor", "end")
.text("Y-Value")

svg.selectAll(".dot")
.data(data)
.enter().append("circle")
.attr("class", "dot")
.attr("r", 3.5)
.attr("cx", function(d) {
    return x(d.x);
})
.attr("cy", function(d) {
    return y(d.y);
});

svg.append("path")
.datum(data)
.attr("class", "line")
.attr("d", line);

});

function create_data(nsamples) {
var x = [];
var y = [];
var n = nsamples;
var x_mean = 0;
var y_mean = 0;
var term1 = 0;
var term2 = 0;
var noise_factor = 100;
var noise = 0;
// create x and y values
for (var i = 0; i < n; i++) {
    noise = noise_factor * Math.random();
    noise *= Math.round(Math.random()) == 1 ? 1 : -1;
    y.push(i / 5 + noise);
    x.push(i + 1);
    x_mean += x[i]
    y_mean += y[i]
}
// calculate mean x and y
x_mean /= n;
y_mean /= n;

// calculate coefficients
var xr = 0;
var yr = 0;
for (i = 0; i < x.length; i++) {
    xr = x[i] - x_mean;
    yr = y[i] - y_mean;
    term1 += xr * yr;
    term2 += xr * xr;

}
var b1 = term1 / term2;
var b0 = y_mean - (b1 * x_mean);
// perform regression 

var yhat = [];
// fit line using coeffs
for (i = 0; i < x.length; i++) {
    yhat.push(b0 + (x[i] * b1));
}

var data = [];
for (i = 0; i < y.length; i++) {
    data.push({
        "yhat": yhat[i],
        "y": y[i],
        "x": x[i]
    })
}
console.log(data)
return (data);
}