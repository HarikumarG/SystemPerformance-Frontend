import Service from '@ember/service';

export default class EmployeeDetailsService extends Service {

    empName = "";
    empId = "";
    password = "";

    setEmpName(name) {
        this.empName = name;
    }
    setEmpId(id) {
        this.empId = id;
    }
    setPassword(pass) {
        this.password = pass;
    }

    getEmpName() {
        return this.empName;
    }
    getEmpId() {
        return this.empId;
    }
    getPassword() {
        return this.password;
    }
}
