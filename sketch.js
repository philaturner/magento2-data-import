//JSON data
var M1headerJSON;
var M2headerJSON;
var M1M2MappingJSON;

//tables
var table;
var outputTable;
var mainTable;
var tempTable;

//table arrays
var mainArray = [];
  var tempArr = [];

//other attributes
var selectedAttributes = [];
var additionalAttributes = [];
var output = "";
var dropzone;
var fileStatusP;

//other
var button;
var completeP;

function preload(){
  M1headerJSON = loadJSON("data/M1-headers.JSON")
  M2headerJSON = loadJSON("data/M2-headers.JSON")
  M1M2MappingJSON = loadJSON("data/M1-M2-mapping.JSON")
  console.log("JSONs Loaded.");
}

function setup() {
  noCanvas();
  var button = select('#submit');
  dropzone = select('#dropzone');
  dropzone.dragOver(highlight);
  dropzone.dragLeave(unhighlight);
  dropzone.drop(gotFile, unhighlight);
}

function gotFile(file){
  fileStatusP = select('#filestatus');
  fileStatusP.html("Loading file......");
  table = loadTable(file.data, "csv", "header");
  tempTable = loadTable(file.data, "csv", "header", main);
}

function highlight(){
  dropzone.style('background-color','#ccc');
  dropzone.style('color','#fff');
  dropzone.style('font-size','20pt');
}

function unhighlight(){
  dropzone.style('background-color','#fff');
  dropzone.style('color','#000');
  dropzone.style('font-size','18pt');
}

function main() {
  console.log("File has been loaded");
  fileStatusP.html("File has been loaded");
  populateAddAtt();
}

function createM2Table(){
  //*****Main M2 Table*****
  //loop through mapping JSON and pull add data to new table
  mainTable = new p5.Table();
  //sets columns
  for (var i = 0; i < M1M2MappingJSON.mapping.length; i++){
      mainTable.addColumn(M1M2MappingJSON.mapping[i].m2);
  }
  //sets rows
  for (var i = 0; i < table.rows.length; i++){
    var newRow = mainTable.addRow();
    for (var j = 0; j < mainTable.columns.length; j++){
      //check if ignore or not then add appropiate value
      if (M1M2MappingJSON.mapping[j].m1 == "ignore"){
        mainTable.set(i, mainTable.columns[j], M1M2MappingJSON.mapping[j].default_value);
      } else {
        var searchHeader = M1M2MappingJSON.mapping[j].m1
        var searchColumn = table.getColumn(searchHeader);
        var searchValue = searchColumn[i]
        //check for name attribute and replaces all , with a '-'
        if (searchHeader == 'name'){
          searchValue = searchValue.replace(/,/g, "-");
        }
        mainTable.set(i, mainTable.columns[j], searchValue);
      }
    }
  }
  mainArray = mainTable.getArray();
  mainArray.push(mainTable.getColumn);

  //read m2 headers and splice into main array
  for (var i = 0; i < M1M2MappingJSON.mapping.length; i++){
    tempArr.push(M1M2MappingJSON.mapping[i].m2)
  }
  mainArray.splice(0, 0, tempArr);

  save(mainArray, 'm2_import_data', "csv");
  fileStatusP.html("Created file");
}

function createAddAttTable(){
  //*****Additional attribute table*****
  //loop through m2 json data and remove columns from table
  for (var i = 0; i < M2headerJSON.headers.length; i++){
      table.removeColumn(M2headerJSON.headers[i].name);
  }
  //loop through m1 jason data and remove columns from table
  for (var i = 0; i < M1headerJSON.headers.length; i++){
      table.removeColumn(M1headerJSON.headers[i].name);
  }
  console.log(table);
  //loop backwards through table and remove any non selected attributes
  for (var i = table.columns.length; i >= 0; i--){
    for (var j = 0; j < selectedAttributes.length; j++){
      if (!inArray(table.columns[i],selectedAttributes)){
        var tempName = table.columns[i];
        table.removeColumn(tempName);
      }
    }
  }

  //concat all row and push into array
  for (var j = 0; j < table.rows.length; j++){
    for (var i = 0; i < table.rows[j].arr.length; i++){
      //checks if attribute blank and ignores if so
      if (table.rows[j].arr[i] == "" || table.rows[j].arr[i] == "Please select..." || table.rows[j].arr[i] == "None"){
        continue;
      } else {
        tempStr = table.columns[i] + '=' + (table.rows[j].arr[i]) + ',';
        output += tempStr;
        //replace color with color_fabric
        output = output.replace(/color/g, "color_fabric");
      }
    }
    additionalAttributes.push(output);
    output = "";
  }

  //define new table and out new tsv to avoid conflict with commas
  outputTable = new p5.Table();
  //outputTable.addColumn('sku');
  outputTable.addColumn('additional_attributes');
  for (var i = 0; i < additionalAttributes.length; i++){
      var newRow = outputTable.addRow();
      var tempstring = additionalAttributes[i];
      //newRow.setString('sku', skuTable[i]);
      newRow.setString('additional_attributes', tempstring);
  }
  //output additional attribute table
  saveTable(outputTable, 'add_attributes_list', "tsv");
  fileStatusP.html("Created file");
}

function populateAddAtt(){
  fileStatusP.html("*File has been loaded*<br>Select the additional attibutes from the list below to add to the export.");
  dropzone.remove();
  multiselect = select('#multiSelect');
  for (var i = 0; i < M2headerJSON.headers.length; i++){
      tempTable.removeColumn(M2headerJSON.headers[i].name);
  }
  for (var i = 0; i < M1headerJSON.headers.length; i++){
      tempTable.removeColumn(M1headerJSON.headers[i].name);
  }
  //populate multi select
  for (var i = 0; i < tempTable.columns.length; i++){
      multiselect.option(tempTable.columns[i]);
  }
  //shows multiselect box and reenabled button
  multiselect.show();
  button = select('#submitB');
  button.removeAttribute('disabled');
  button.mousePressed(processFiles);
}

function processFiles(){
  //check some attribute have been selected
  if (multiselect.elt.selectedOptions.length == 0){
    alert("You must select some attribute options to continue");
  } else {
    button.attribute('disabled',false);
    multiselect.attribute('disabled',false);
    completeP = createP("Now processing your files....")
    for (var i = 0; i < multiselect.elt.selectedOptions.length; i++){
      selectedAttributes.push(multiselect.elt.selectedOptions[i].value);
    }
    createM2Table();
    createAddAttTable();
    completeP.html("Files generated!")
  }
}

//ref: https://stackoverflow.com/questions/7378228/check-if-an-element-is-present-in-an-array
function inArray(needle,haystack)
{
    var count=haystack.length;
    for(var i=0;i<count;i++)
    {
        if(haystack[i]===needle){return true;}
    }
    return false;
}
