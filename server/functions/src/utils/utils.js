const firebase = require("firebase/app");
require("firebase/firestore")
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});

const db = firebase.firestore();

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'smartworking.unisa@gmail.com',
        pass: 'SWunisa2019'
    }
});


module.exports = {

    'sendBlockedDays': function sendBlockedDays(response, collection, blockedDates, flag, size) {

        if (collection.size != 0) {
            
            collection.forEach(blocked => {

                if (!this.containsDate(blocked, blockedDates))

                    blockedDates.push({giorno: blocked.data().giorno, mese: blocked.data().mese, anno: blocked.data().anno})

            })

            if (flag == size)

                return response.send(blockedDates)

        } 

    },

    'sortDates': function sortDates(dates) {
        let sortedDates = dates.sort((first, second) => {
                        
            const data_1 = new Date(parseInt(first.anno), parseInt(first.mese), parseInt(first.giorno));
            const data_2 = new Date(parseInt(second.anno), parseInt(second.mese), parseInt(second.giorno));
    
            if (data_1.getTime() < data_2.getTime()) {
                return -1;
            } else if (data_1.getTime() > data_2.getTime()){
                return 1;
            } else {
                return  0;
            } 

        })

        return sortedDates;
    },

    'getWeekNumber': function getWeekNumber(elem) {
        const d = new Date(Date.UTC(parseInt(elem.anno), parseInt(elem.mese), parseInt(elem.giorno)));

        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);

        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    },

    'containsDate': function containsDate(date, dates) {
        let flag = false

        for (i = 0; i < dates.length; i++) {

            if (date.data().giorno == dates[i].giorno && date.data().mese == dates[i].mese && date.data().anno == dates[i].anno) {
                
                blockedDates.push({giorno: elemToAdd.giorno, mese: elemToAdd.mese, anno: elemToAdd.anno})

                flag = true

                break

            }

        }

        return flag;

    },

    'getBlockedDates': function getBlockedDates(blocked, dates) {
        let blockedDates = []
        
        blocked.forEach(elemBlocked => {

            dates.forEach(elemToAdd => {
                if (elemBlocked.giorno == elemToAdd.giorno && elemBlocked.mese == elemToAdd.mese && elemBlocked.anno == elemToAdd.anno) {
                    
                    blockedDates.push({giorno: elemToAdd.giorno, mese: elemToAdd.mese, anno: elemToAdd.anno})

                }
            })

        })

        return blockedDates;

    },

    'areValidDates': function areValidDates(dates) {
        let week = 0;
        let occurrences = 1;
        let flag = true;

        for (i = 0; i < dates.length; i++) {

            week = this.getWeekNumber(dates[i])

            for(j = 0; j < dates.length; j++) {
                if (j == i)
                    continue;
                
                else {
                    if (week == this.getWeekNumber(dates[j]))
                        occurrences++;
                }
            }

            if (occurrences > 2) {
                flag = false

                break;

            } else {

                occurrences = 1
            }
        }

        return flag;
    },

    'addDates': function addDates(dates, uid, batch) {
        let doc;

        dates.forEach(elem => {
            doc = db.collection("SmartWorking").doc();

            batch.set(doc, {
                giorno: elem.giorno,
                mese: elem.mese,
                anno: elem.anno,
                dipendente: uid
            })
        })
    },

    'createSmartWorkingCalendarForEmail': function createSmartWorkingCalendarForEmail(dates) {
        let s = "";

        for (i = 0; i < dates.length; i++) {
            date = dates[i].giorno + "/" + dates[i].mese + "/" + dates[i].anno
            s = s
            + "<div style=\"display: flex; align-items: center; justify-content: center; flex-direction: row\">"
            + "<img style=\"width: 30px; height: 30px;\" src=\"https://firebasestorage.googleapis.com/v0/b/smart-working-5f3ea.appspot.com/o/calendar.png?alt=media&token=9d32b1a0-e195-4768-9fae-af0e6d0eec59\" />"
            + "<p style=\"font-size: 20px; font-weight: bold; margin-left: 15px;\">"+ date +"</p>"
            + "</div>"
        }

        return s;
    },

    'sendSmartWorkingCalendar': function sendSmartWorkingCalendar(uid, request, response, dates) {

        db.collection('Dipendente').doc(uid).get().then(document => {
            
            cors(request, response, () => {
        
                const mailOptions = {
                    from: 'Amministratore Smart Working<smartworking.unisa@gmail.com>',
                    to: 'antonio.basileo92@gmail.com',
                    subject: 'Piano di Smart Working',
                    html: "<p style=\"font-size: 16px;\">Ciao " + document.data().nome + " " + document.data().cognome + ",</p>" 
                    + "<p style=\"font-size: 16px;\">ecco il tuo piano di Smart Working per il prossimo mese:</p>" 
                    + "<br /> "
                    + "<div style=\"background-color: #fafafa; padding: 15px\">"
                    + this.createSmartWorkingCalendarForEmail(dates)
                    + "</div>"
                    + "<br /> "
                    + "<p style=\"font-size: 16px;\">Cordiali saluti,</p>"
                    + "<p style=\"font-size: 16px;\">il team Smart Working</p>"

                };
                                    
                return transporter.sendMail(mailOptions, (error, info) => {

                    if (error){

                        return response.send({hasError: true, error: error.message});

                    } else {

                        return response.send({hasError: false});
                    }

                });
            });  

        }).catch(error => response.send({hasError: true, error: error.message}))

    },

    'db': db

}