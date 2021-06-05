//import SerialPort from 'serialport'
//import Readline from '@serialport/parser-readline'
import nmea from 'nmea'

export default function (moduleOptions) {

  this.nuxt.hook('listen', async function (ready) {
    /*
    try { 
      const port = new SerialPort('com11', {
        baudRate: 4800,
      })
      
      const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
    
      parser.on('data', function(line) {
    
        try {
          sentence = nmea.parse(line)
    
          switch ( sentence.type ) {
            default : 
            break;
            case 'nav-info' :
              if ( 'valid' == sentence.status ) {
                
              }
          }
        }
        catch (error) {
    
        }
      });
    }
    catch (error) {

    }
    
  */
  })

}