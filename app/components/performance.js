import Component from '@ember/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import jQuery from 'jquery';

export default class PerformanceComponent extends Component {
    @tracked showSettings = false;
    @tracked showAlertSetting = false;
    @tracked alertNotify = false;
    @tracked machinelist = [];
    @tracked showLivestats = false;

    @service ('employee-details') details;

    @tracked userName = this.details.getEmpName();
    @tracked userId = this.details.getEmpId();
    password = this.details.getPassword();
    systemName = "";

    dpsCpu = [];
    dpsUsedRAM = [];
    chartCpu = undefined;
    chartRAM = undefined;
    fromTimestamp = "";
    toTimestamp = "";
    timeInterval = undefined;
    timeIntervalRelative = undefined;
    maxCpuUsage = "";
    maxRamUsage = "";
    @tracked livetimestamp = "NULL";
    @tracked livetotalram = "NULL";
    @tracked liveusedram = "NULL";
    @tracked livecpuusage = "NULL";

    @service ('toast') toast;
    toastOptions = {
        closeButton: false,
        debug: false,
        newestOnTop: true,
        progressBar: false,
        positionClass: 'toast-top-right',
        preventDuplicates: true,
        onclick: null,
        showDuration: '300',
        hideDuration: '1000',
        timeOut: '3000',
        extendedTimeOut: '1000',
        showEasing: 'swing',
        hideEasing: 'linear',
        showMethod: 'show',
        hideMethod: 'hide'
    }


    didInsertElement() {
        this.onDatePicker();
        this.initializeGraph();
        this.getMachineList();
    }


    @action selectMachine(machine) {
        this.systemName = machine;
        this.getSettingsStats();
    }
    @action onGetstats() {
        var timestamp = $('input[name="daterange"]').val();
        if(timestamp == '') {
            document.getElementById("requesttimer").options.selectedIndex = 0;
            this.stopTimeInterval();
            this.toast.error('',"Select Date and Time",this.toastOptions);
        } else {
            var d = timestamp.split(" to ");
            this.fromTimestamp = d[0];
            this.toTimestamp = d[1];
            if(this.systemName == "") {
                document.getElementById("requesttimer").options.selectedIndex = 0;
                this.stopTimeInterval();
                this.toast.error('',"Select a Machine",this.toastOptions);
            }
            else {
                this.getStatsReq();
            }
        }
    }
    @action requestTimer(timer) {
        var timeval = parseInt(timer);
        if(timeval == 0) {
            this.stopTimeInterval();
        } else {
            this.stopTimeInterval();
            this.startTimeInterval(timeval);
        }
    }
    @action relativeTime(time) {
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
            this.userName = name;
        }
    }
    updateSettings(response) {
        let alertConfig = response["Alert"];
        this.alertNotify = alertConfig["ToggleNotify"] == "true" ? true : false;
        this.showAlertSetting = this.alertNotify == true ? true : false;
        this.maxCpuUsage = alertConfig["MaxCpuUsage"] == "NULL" ? "" : alertConfig["MaxCpuUsage"];
        this.maxRamUsage = alertConfig["MaxRAMUsage"] == "NULL" ? "" : alertConfig["MaxRAMUsage"];
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
    stopTimeInterval() {
        if(this.timeInterval != undefined) {
            clearInterval(this.timeInterval);
            this.timeInterval = undefined;
        }
    }
    startTimeInterval(timeval) {
        this.timeInterval = setInterval(this.onGetstats,timeval);
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


    getMachineList() {
        jQuery.ajax({
            url:"http://localhost:8080/SystemPerformance-Backend/getAllMachine",
            type: "POST",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "EmpID": this.userId,
                "EmpName": this.userName
            })
        }).then((response) => {
            for(var i in response) {
                if(response[i]["systemname"]) {
                    this.machinelist.pushObject({name:response[i]["systemname"]});
                }
            }
        }).catch(function (error) {
            console.log(error);
        });
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
                "SystemName": this.systemName,
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
    getLiveStatsReq() {
        this.dpsCpu = [];
        this.dpsUsedRAM = [];
        jQuery.ajax({
            url:"http://localhost:8080/SystemPerformance-Backend/getLiveStats",
            type: "POST",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "SystemName": this.systemName
            })
        }).then((response) => {
            console.log(response);
            for(var i in response) {
                if(response[i]["timestamp"]) {
                    this.livetimestamp = response[i]["timestamp"];
                    this.livetotalram = response[i]["totalram"];
                    this.liveusedram = response[i]["usedram"];
                    this.livecpuusage = response[i]["cpuusage"];
                }
            }
            this.ChartRender();
        }).catch(function (error) {
            console.log(error);
        });
    }
    getSettingsStats() {
        jQuery.ajax({
            url:"http://localhost:8080/SystemPerformance-Backend/getAllConfig",
            type: "POST",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "SystemName":this.systemName
            })
        }).then((response) => {
            this.updateSettings(response);
        }).catch(function (error) {
            console.log(error);
        });
    }


    @action onSettings(){
        if(this.systemName == "") {
            this.toast.error('',"Select a Machine",this.toastOptions);
        } else {
            this.showSettings = true;
        }
    }
    @action onAlertToggle(value) {
        this.alertNotify = value == false ? true : false;
        this.showAlertSetting = this.alertNotify == true ? true : false;
    }
    @action onSettingSave() {
        if(!this.alertNotify) {
            this.showSettings = false;
            this.sendAlertReq("false","NULL","NULL");
        }
        else if(this.alertNotify){
            if(this.maxCpuUsage != "" && this.maxRamUsage != "" && parseInt(this.maxCpuUsage).toString() == this.maxCpuUsage && parseFloat(this.maxRamUsage).toString() == this.maxRamUsage) {
                this.showSettings = false;
                this.sendAlertReq("true",this.maxCpuUsage,this.maxRamUsage);
            }
            else
                this.toast.error('','CPU Usage and RAM Usage should be Integer and Decimal and Non Empty',this.toastOptions);
        }
    }
    @action onSettingClose() {
        this.showSettings = false;
    }
    sendAlertReq(notify,CPU,RAM) {
        jQuery.ajax({
            url:"http://localhost:8080/SystemPerformance-Backend/alertConfigUpdate",
            type: "POST",
            contentType:"application/json; charset=utf-8",
            dataType:"json",
            data: JSON.stringify({
                "EmpID": this.userId,
                "Password": this.password,
                "SystemName": this.systemName,
                "AlertNotify": notify,
                "MaxRAMUsage": RAM,
                "MaxCPUUsage": CPU
            })
        }).then((response) => {
            if(response == "Alert Updated")
                this.toast.success('','Saved',this.toastOptions);
            else
                this.toast.error('','Not Saved',this.toastOptions);
        }).catch(function (error) {
            console.log(error);
        });
    }

    @action onGetlivestats() {
        this.livetimestamp = "NULL";
        this.livetotalram = "NULL";
        this.liveusedram = "NULL";
        this.livecpuusage = "NULL";
        document.getElementById("relativetime").options.selectedIndex = 0;
        this.relativeTime("0");
        document.getElementById("requesttimer").options.selectedIndex = 0;
        this.stopTimeInterval();
        if(this.systemName == "") {
            this.toast.error('',"Select a Machine",this.toastOptions);
        } else {
            this.getLiveStatsReq();
            this.showLivestats = true;
        }
    }
    @action onLiveStatsClose() {
        this.showLivestats = false;
    }
}