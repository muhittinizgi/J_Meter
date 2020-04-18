/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 6;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "KO",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "OK",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.7374429223744292, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "AboutPage-1"], "isController": false}, {"data": [0.0, 500, 1500, "ContactsPage"], "isController": false}, {"data": [0.6578947368421053, 500, 1500, "HomePage"], "isController": false}, {"data": [1.0, 500, 1500, "AboutPage-2"], "isController": false}, {"data": [1.0, 500, 1500, "HomePage-0"], "isController": false}, {"data": [0.7, 500, 1500, "HomePage-1"], "isController": false}, {"data": [0.55, 500, 1500, "ContactsPage-0"], "isController": false}, {"data": [1.0, 500, 1500, "AboutPage"], "isController": false}, {"data": [0.7, 500, 1500, "ContactsPage-1"], "isController": false}, {"data": [0.5, 500, 1500, "ContactsPage-2"], "isController": false}, {"data": [1.0, 500, 1500, "AboutPage-0"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 219, 0, 0.0, 560.2785388127853, 34, 2489, 1208.0, 2269.0, 2325.4000000000005, 60.26417171161255, 1861.1332962128508, 10.621259287286737], "isController": false}, "titles": ["Label", "#Samples", "KO", "Error %", "Average", "Min", "Max", "90th pct", "95th pct", "99th pct", "Transactions\/s", "Received", "Sent"], "items": [{"data": ["AboutPage-1", 20, 0, 0.0, 48.95, 34, 145, 65.9, 141.04999999999995, 145.0, 60.79027355623101, 26.23955167173252, 7.420687689969604], "isController": false}, {"data": ["ContactsPage", 20, 0, 0.0, 2260.3, 1998, 2489, 2329.2000000000003, 2481.2, 2489.0, 7.949125596184419, 302.1269344942369, 2.96539646263911], "isController": false}, {"data": ["HomePage", 19, 0, 0.0, 659.9473684210527, 366, 1008, 992.0, 1008.0, 1008.0, 16.681299385425813, 1677.7575244183495, 3.844518217734855], "isController": false}, {"data": ["AboutPage-2", 20, 0, 0.0, 70.49999999999997, 39, 130, 86.80000000000001, 127.84999999999997, 130.0, 55.40166204986149, 1781.239179362881, 6.817001385041552], "isController": false}, {"data": ["HomePage-0", 20, 0, 0.0, 88.25, 67, 135, 134.9, 135.0, 135.0, 23.52941176470588, 11.006433823529411, 2.7113970588235294], "isController": false}, {"data": ["HomePage-1", 20, 0, 0.0, 579.45, 281, 868, 850.7, 867.3, 868.0, 20.0, 2002.1875, 2.3046875], "isController": false}, {"data": ["ContactsPage-0", 20, 0, 0.0, 902.45, 483, 1380, 1205.7, 1371.3999999999999, 1380.0, 14.214641080312722, 6.71863894811656, 1.7629486496090974], "isController": false}, {"data": ["AboutPage", 20, 0, 0.0, 160.40000000000003, 137, 268, 210.10000000000008, 265.29999999999995, 268.0, 45.146726862302486, 1490.4592268623026, 16.577313769751694], "isController": false}, {"data": ["ContactsPage-1", 20, 0, 0.0, 520.3, 382, 609, 604.7, 608.8, 609.0, 18.281535648994517, 8.658735146252285, 2.267338893967093], "isController": false}, {"data": ["ContactsPage-2", 20, 0, 0.0, 836.9, 621, 1125, 1080.6, 1122.8, 1125.0, 14.792899408284024, 548.243776580991, 1.8491124260355027], "isController": false}, {"data": ["AboutPage-0", 20, 0, 0.0, 40.6, 34, 58, 47.0, 57.44999999999999, 58.0, 90.09009009009009, 38.798564189189186, 10.99732545045045], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Percentile 1
            case 8:
            // Percentile 2
            case 9:
            // Percentile 3
            case 10:
            // Throughput
            case 11:
            // Kbytes/s
            case 12:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 219, 0, null, null, null, null, null, null, null, null, null, null], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
