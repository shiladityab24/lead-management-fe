import { LightningElement } from 'lwc';
import LightningConfirm from 'lightning/confirm'
import { leadSourceList } from './leadSourceList';
const BACKEND_URL = 'https://lead-management-be.onrender.com'||'http://localhost:3002'
const ADD_ACTION = 'add'
const EDIT_ACTION ='EDIT'
export default class Home extends LightningElement{
    backendUrl=BACKEND_URL
    leadRecords = []
    leadSourceTableData= []
    chartData
    showModal = false
    formData={}
    action
    loggedInUser
    showSpinner = false


    // Define a geter for category options
    get leadSourceOptions(){
        return leadSourceList
    }

    // Define a getter that sets the modal label
    get modalActionLabel(){
        return this.action === EDIT_ACTION? 'Update Lead': 'Add Lead'
    }




    async connectedCallback(){
        try{
            const user = await this.getLoggedInUser()
            console.log("user info",user)
            if(!user.user_id){
                window.location.href = '/login'
            } else {
                this.loggedInUser = user
                await this.fetchLeadData()
            }
        }catch(error){
            console.error("resposne error",error)
        }
      
    }

    async fetchLeadData(){
        const leads = await this.getLeads()
        this.leadRecords = leads.totalSize > 0 ? leads.records: []
        this.createChartData()
    }

    // Method to get logged-in user data
    async getLoggedInUser(){
        const url = `${BACKEND_URL}/oauth2/whoami`
        return await this.makeApiRequest(url)
    }

    //Method to get leads data
    async getLeads(){
        const url = `${BACKEND_URL}/leads`
        return await this.makeApiRequest(url)
    }

    //Generic API Method
    async makeApiRequest(url, method = 'GET', data=null){
        try{
            this.showSpinner = true
            const requestOptions = {
                method,
                headers:{
                    'Content-Type':'application/json'
                },
                body:data ? JSON.stringify(data):null
            }
            const response = await fetch(url, requestOptions)
            if(!response.ok){
                throw new Error(response.statusText)
            }
            return response.json()
        }catch(error){
            console.log("Error Occurred", error)
        } finally{
            this.showSpinner = false
        }

    }

    //edit row handler
    editHandler(event){
        this.action = EDIT_ACTION
        this.showModal = true
        this.formData ={...event.detail}
        console.log(event.detail)
    }
    //delete row handler
    deleteHandler(event){
        console.log(event.detail)
        const url = `${BACKEND_URL}/leads/${event.detail.Id}`
        this.handleConfirmClick(url)
    }
    // Method to make a confirmation dialog for delete action
    async handleConfirmClick(url) {
        const result = await LightningConfirm.open({
            message: 'Are you sure you want to delete',
            variant: 'header',
            label: 'Confirmation',
            theme: 'error'
            // setting theme would have no effect
        });
        if(result){
            const response = await this.makeApiRequest(url,'DELETE')
            console.log("deleted record",this.formData)
            if(response.id){
                await this.fetchLeadData()
            }
        }
        //Confirm has been closed
        //result is true if OK was clicked
        //and false if cancel was clicked
    }
    // Method to create chart data based on leads
    createChartData(){
        const leadSourceSums = {}

        this.leadRecords.forEach(item=>{
            const {Amount__c,LeadSource} = item
            // Check if the category already exists in the sums object
            if(leadSourceSums[LeadSource]){
                leadSourceSums[LeadSource] += Amount__c
            }else {
                leadSourceSums[LeadSource] = Amount__c
            }
        })
        console.log("leadSourceSums",leadSourceSums)
        this.leadSourceTableData = Object.keys(leadSourceSums).map((item,index)=>{
            return ({
                "id": index+1,
                "leadsource":item,
                "amount":this.formatCurrency(leadSourceSums[item])
            })
        })
        console.log("leadSourceTableData",this.leadSourceTableData)
        this.chartData = {
            labels:Object.keys(leadSourceSums),
            results:Object.values(leadSourceSums)
        }
    }

    formatCurrency(number){
        return number.toLocaleString('en-IN',{
            style: 'currency',
            currency: 'INR'})
    }

    // Modal Cancel Handler
    cancelHandler(){
        this.action = null
        console.log("Cancel Clicked")
        this.showModal =false
    }

 //Modal Save Handler
 saveHandler(){
    if(this.isFormValid()){
        // this.showModal = false
        if(this.formData.Id){
            console.log("Save Clicked success for Update", this.formData)
                const url = `${BACKEND_URL}/leads/${this.formData.Id}`
                this.addAndUpdateHandler(url, 'PUT')
        } else {
            console.log("Save Clicked success for Add", this.formData)
            const url = `${BACKEND_URL}/leads`
            this.addAndUpdateHandler(url,'POST')
        }
        
    } else {
        console.log("Save Clicked Validation failed")
    }
    
}


    // Method to handler adding and updating of leads
    async addAndUpdateHandler(url,method){
        const response = await this.makeApiRequest(url,method,this.formData)
        if(response.id){
            await this.fetchLeadData()
            this.showModal = false
            this.action= null
        }
    }

    // Add Expense Handler
    addExpense(){
        this.showModal  = true
        this.formData={}
        this.action= ADD_ACTION
    }

    // form change handler
    changeHandler(event){
        // const name = event.target.name
        // const value = event.target.value
        const {name,value} = event.target
        this.formData={...this.formData,[name]:value}
    }

    // form validation handler
    //form Validation handler
    isFormValid(){
        let isValid = true
        let inputFields = this.template.querySelectorAll('.validate')
        inputFields.forEach(inputField=>{
            if(!inputField.checkValidity()){ 
                inputField.reportValidity()
                isValid = false
            }
        })
       return isValid
    }


}