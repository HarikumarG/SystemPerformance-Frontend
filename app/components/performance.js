import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import jQuery from 'jquery';

export default class PerformanceComponent extends Component {
    clientname = undefined;
    dpsCpu = [];
    dpsUsedRAM = [];
    chartCpu = undefined;
    chartRAM = undefined;
    fromTimestamp = "";
    toTimestamp = "";
    
    // constructor() {
    //     super(...arguments);
    //     this.getName();
    // }
    getName() {
        var name = prompt("Enter your name");
        if(name == null || name == "")
            this.getName();
        else {
            this.clientname = name;
        }
    }
    @action onGetstats() {
        var timestamp = $('input[name="daterange"]').val();
        if(timestamp == '') {
            alert("Select Date and Time");
        } else {
            var d = timestamp.split(" to ");
            this.fromTimestamp = d[0];
            this.toTimestamp = d[1];
            this.getStatsReq();
        }
    }
    onDatePicker(element) {
        $('input[name="daterange"]').daterangepicker({
            opens: 'right',
            autoUpdateInput: false,
            timePicker: true,
            timePicker24Hour: true,
            timePickerSeconds: true,
            locale: {
                format: 'YYYY-MM-DD HH:mm:ss'
            }
        });
        
        $('input[name="daterange"]').on('apply.daterangepicker',function(ev, picker) {
            $(this).val(picker.startDate.format('YYYY-MM-DD HH:mm:ss') + ' to ' + picker.endDate.format('YYYY-MM-DD HH:mm:ss'));
        });

        $('input[name="daterange"]').on('cancel.daterangepicker',function(ev, picker) {
            $(this).val('');
        });
    }
    async getStatsReq() {
        await this.initializeGraph();
        jQuery.ajax({
            url:"http://localhost:8080/SystemPerformance-Backend/getStatsHttp",
            type: "POST",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "fromTimestamp": this.fromTimestamp,
                "toTimestamp": this.toTimestamp
            })
        }).then((response) => {
            for(var i in response) {
                if(response[i]["timestamp"]) {
                    this.chartRender(response[i]);
                }
            }
        }).catch(function (error) {
            console.log(error);
        })
    }
    initializeGraph() {
        this.dpsCpu = [];
        this.dpsUsedRAM = [];
        this.chartCpu = new CanvasJS.Chart("cpustats_div", {
            theme: "light1",
            title:{
                text: "CPU Usage", 
                fontWeight: "bolder",
                fontColor: "#008B8B",
                fontFamily: "tahoma",        
                fontSize: 25,
                padding: 10       
            },
            toolTip: {
                animationEnabled: true,
                contentFormatter: function(e) {
                    var content = "";
                    var d = new Date(e.entries[0].dataPoint.x);
                    var datetime = d.toLocaleString("en-IN",{ 
                        hour12: false, 
                        dateStyle: "medium",
                        timeStyle: "medium"
                    });
                    content += datetime +" - <strong>"+e.entries[0].dataPoint.y+" %</strong>";
                    return content;
                }
            },
            axisY: {
		        title: "CPU Usage (in %)",
                titleFontSize: 18,
                margin: 10, 
                titleFontWeight: "bold",
                labelFontSize: 12,
                suffix: " %",
                interlacedColor: "Azure",
                gridThickness: 1
	        },
            axisX: {
                title: "Time Stamp (in 24-hr format)",
                titleFontSize: 18,
                margin: 10,
                labelAngle: -50,
                labelMaxWidth: 70,
			    labelWrap: true,
                labelFontSize: 12,
                valueFormatString: "HH:mm",
                titleFontWeight: "bold",
                // interval: 1,
                // intervalType: "hour"
            },
            zoomEnabled: true,
            data: [{
                type: "splineArea",
                name: "Usage Percentage",
                dataPoints: this.dpsCpu,
                markerType: "circle",
                markerSize: 5
            }]
        });
        this.chartRAM = new CanvasJS.Chart("RAM_memory_div", {
            theme: "light1",
            title:{
                text: "RAM Usage", 
                fontWeight: "bolder",
                fontColor: "#008B8B",
                fontFamily: "tahoma",        
                fontSize: 25,
                padding: 10       
            },
            toolTip: {
                animationEnabled: true,
                contentFormatter: function(e) {
                    var content = "";
                    var d = new Date(e.entries[0].dataPoint.x);
                    var datetime = d.toLocaleString("en-IN",{ 
                        hour12: false,
                        dateStyle: "medium",
                        timeStyle: "medium"
                    });
                    content += datetime +" - <strong>"+e.entries[0].dataPoint.y+" GB</strong>";
                    return content;
                }
            },
            axisY: {
                title: "RAM Usage (in GB)",
                titleFontSize: 18,
                margin: 10,
                titleFontWeight: "bold",
                labelFontSize: 12,
                suffix: " GB",
                interlacedColor: "Azure",
                gridThickness: 1
            },
            axisX: {
                title: "Time Stamp (in 24-hr format)",
                titleFontSize: 18,
                margin: 10,
                labelAngle: -50,
                labelMaxWidth: 70,
			    labelWrap: true,
                labelFontSize: 12,
                valueFormatString: "HH:mm",
                titleFontWeight: "bold"
            },
            zoomEnabled: true,
            data:[
            {
                type: "splineArea",
                name: "Used RAM",
                dataPoints: this.dpsUsedRAM,
                markerType: "circle",
                markerSize: 5
            }]
        });
    }
    chartRender(data) {
        this.dpsCpu.push({
            x: new Date(data["timestamp"]),
            y: data["cpuusage"]
        })
        this.dpsUsedRAM.push({
            x: new Date(data["timestamp"]),
            y: data["usedram"]
        })
        this.chartCpu.render();
        this.chartRAM.render();
    }

}