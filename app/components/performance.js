import Component from '@ember/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import jQuery from 'jquery';

export default class PerformanceComponent extends Component {
    @tracked showSettings = false;
    @tracked showAlertSetting = false;
    @tracked sendNotify = false;
    @tracked clientname = undefined;
    dpsCpu = [];
    dpsUsedRAM = [];
    chartCpu = undefined;
    chartRAM = undefined;
    fromTimestamp = "";
    toTimestamp = "";
    timeInterval = undefined;
    timeIntervalRelative = undefined;
    cpuUsage = "";
    ramUsage = "";
    didInsertElement() {
        this.onDatePicker();
        this.initializeGraph();
        this.getName();
        this.getSettingsStats();
    }
    @action onGetstats() {
        var timestamp = $('input[name="daterange"]').val();
        if(timestamp == '') {
            document.getElementById("requesttimer").options.selectedIndex = 0;
            this.stopTimeInterval();
            alert("Select Date and Time");
        } else {
            var d = timestamp.split(" to ");
            this.fromTimestamp = d[0];
            this.toTimestamp = d[1];
            this.getStatsReq();
        }
    }
    @action requestTimer(timer) {
        var timeval = parseInt(timer);
        console.log(timeval);
        if(timeval == 0) {
            this.stopTimeInterval();
        } else {
            this.stopTimeInterval();
            this.startTimeInterval(timeval);
        }
    }
    @action relativeTime(time) {
        console.log("Relative time");
        this.stopTimeIntervalRelative();
        this.startTimeIntervalRelative(time);
    }
    @action onCustomRange() {
        document.getElementById("relativetime").options.selectedIndex = 0;
        this.relativeTime("0");
    }
    getName() {
        var name = prompt("Enter your name");
        if(name == null || name == "")
            this.getName();
        else {
            this.clientname = name;
        }
    }
    stopTimeInterval() {
        if(this.timeInterval != undefined) {
            clearInterval(this.timeInterval);
            this.timeInterval = undefined;
        }
    }
    startTimeInterval(timeval) {
        this.timeInterval = setInterval(this.onGetstats,timeval);
    }
    getStatsReq() {
        this.dpsCpu = [];
        this.dpsUsedRAM = [];
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
            console.log(response);
            for(var i in response) {
                if(response[i]["timestamp"]) {
                    this.chartDataBuild(response[i]);
                }
            }
            this.ChartRender();
        }).catch(function (error) {
            console.log(error);
        });
    }
    initializeGraph() {
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
                markerType: "circle",
                markerSize: 5
            }]
        });
    }
    chartDataBuild(data) {
        this.dpsCpu.push({
            x: new Date(data["timestamp"]),
            y: data["cpuusage"]
        })
        this.dpsUsedRAM.push({
            x: new Date(data["timestamp"]),
            y: data["usedram"]
        })
    }
    ChartRender() {
        this.chartCpu.options.data[0].dataPoints = this.dpsCpu;
        this.chartRAM.options.data[0].dataPoints = this.dpsUsedRAM;
        this.chartCpu.render();
        this.chartRAM.render();
    }

    onDatePicker(element) {
        $('input[name="daterange"]').daterangepicker({
            opens: 'right',
            timePicker: true,
            timePicker24Hour: true,
            timePickerSeconds: true,
            autoUpdateInput: false,
            alwaysShowCalendars: true,
            locale: {
                format: 'YYYY-MM-DD HH:mm:ss'
            }
        });
        $('input[name="daterange"]').on('apply.daterangepicker',function(ev, picker) {
            $('input[name="daterange"]').val(picker.startDate.format('YYYY-MM-DD HH:mm:ss') + ' to ' + picker.endDate.format('YYYY-MM-DD HH:mm:ss'));
        });
        $('input[name="daterange"]').on('cancel.daterangepicker',function(ev, picker) {
            $(this).val('');
        });
    }
    stopTimeIntervalRelative() {
        if(this.timeIntervalRelative != undefined) {
            clearInterval(this.timeIntervalRelative);
            this.timeIntervalRelative = undefined;
        }
    }
    startTimeIntervalRelative(val) {
        if(val == "0") {
            $('input[name="daterange"]').val('');
        }
        else if(val == "5min") {
            this.timeIntervalRelative = setInterval(() => {
                var from = moment().subtract(5,"minutes").format('YYYY-MM-DD HH:mm:ss');
                var to = moment().format('YYYY-MM-DD HH:mm:ss');
                $('input[name="daterange"]').val(from + ' to ' + to);
            },1000);
        } else if(val == "15min") {
            this.timeIntervalRelative = setInterval(() => {
                var from = moment().subtract(15,"minutes").format('YYYY-MM-DD HH:mm:ss');
                var to = moment().format('YYYY-MM-DD HH:mm:ss');
                $('input[name="daterange"]').val(from + ' to ' + to);
            },1000);
        } else if(val == "30min") {
            this.timeIntervalRelative = setInterval(() => {
                var from = moment().subtract(30,"minutes").format('YYYY-MM-DD HH:mm:ss');
                var to = moment().format('YYYY-MM-DD HH:mm:ss');
                $('input[name="daterange"]').val(from + ' to ' + to);
            },1000);
        } else if(val == "today") {
            this.timeIntervalRelative = setInterval(() => {
                var from = moment().startOf('days').format('YYYY-MM-DD HH:mm:ss');
                var to = moment().endOf('days').format('YYYY-MM-DD HH:mm:ss');
                $('input[name="daterange"]').val(from + ' to ' + to);
            },1000);
        } else if(val == "yesterday") {
            this.timeIntervalRelative = setInterval(() => {
                var from = moment().subtract(1, 'days').startOf('days').format('YYYY-MM-DD HH:mm:ss');
                var to = moment().subtract(1, 'days').endOf('days').format('YYYY-MM-DD HH:mm:ss');
                $('input[name="daterange"]').val(from + ' to ' + to);
            },1000);
        } else if(val == "7days") {
            this.timeIntervalRelative = setInterval(() => {
                var from = moment().subtract(6, 'days').startOf('days').format('YYYY-MM-DD HH:mm:ss');
                var to = moment().endOf('days').format('YYYY-MM-DD HH:mm:ss');
                $('input[name="daterange"]').val(from + ' to ' + to);
            },1000);
        } else if(val == "30days") {
            this.timeIntervalRelative = setInterval(() => {
                var from = moment().subtract(29, 'days').startOf('days').format('YYYY-MM-DD HH:mm:ss');
                var to = moment().endOf('days').format('YYYY-MM-DD HH:mm:ss');
                $('input[name="daterange"]').val(from + ' to ' + to);
            },1000);
        } else if(val == "currmonth") {
            this.timeIntervalRelative = setInterval(() => {
                var from = moment().startOf('month').format('YYYY-MM-DD HH:mm:ss');
                var to = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
                $('input[name="daterange"]').val(from + ' to ' + to);
            },1000);
        } else if(val == "lastmonth") {
            this.timeIntervalRelative = setInterval(() => {
                var from = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss');
                var to = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD HH:mm:ss');
                $('input[name="daterange"]').val(from + ' to ' + to);
            },1000);
        }
    }

    @action onSettings(){
        this.showSettings = true;
    }
    @action onAlertToggle(value) {
        this.sendNotify = value == false ? true : false;
        this.showAlertSetting = this.sendNotify == true ? true : false;
    }
    @action onAlertSave() {
        this.showSettings = false;
        if((this.cpuUsage == "" && this.ramUsage == "") || !this.showAlertSetting)
            this.sendAlertReq("false","-1","-1");
        else if(this.cpuUsage == "")
            this.sendAlertReq("true","-1",this.ramUsage);
        else if(this.ramUsage == "")
            this.sendAlertReq("true",this.cpuUsage,"-1");
        else
            this.sendAlertReq("true",this.cpuUsage,this.ramUsage);
    }
    @action onAlertClose() {
        this.showSettings = false;
    }
    sendAlertReq(notify,CPU,RAM) {
        jQuery.ajax({
            url:"http://localhost:8080/SystemPerformance-Backend/alertUpdate",
            type: "POST",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "AlertNotify": notify,
                "RAMUsage": RAM,
                "CPUUsage": CPU
            })
        }).then((response) => {
            console.log(response);
        }).catch(function (error) {
            console.log(error);
        });
    }
    getSettingsStats() {
        jQuery.ajax({
            url:"http://localhost:8080/SystemPerformance-Backend/getAlertSetting",
            type: "POST",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "name":this.clientname
            })
        }).then((response) => {
            this.updateSettings(response);
        }).catch(function (error) {
            console.log(error);
        });
    }
    updateSettings(response) {
        this.sendNotify = response["sendNotify"] == "false" ? false : true;
        this.showAlertSetting = this.sendNotify == true ? true : false;
        this.cpuUsage = response["cpuUsage"];
        this.ramUsage = response["ramUsage"];
    }
}