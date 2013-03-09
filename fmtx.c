// Raspberry Pi frequency set tool for the B-Link / Keene FM transmitter
// Original source from: https://github.com/kenchy/keene-usb-audio
// To compile: gcc -o fmtx fmtx.c -lusb
// If you're missing usb.h make sure libusb-dev is installed
// Due to low level USB access it must run from as root or via sudo
//
// source code modifications by redhawk 20/12/2012:
// fixed - "Segmentation fault" due to out of range frequency (usb handle closed wasn't actually opened)
// added - set frequency with decimal value
// added - option to power off transmitter
// added - stereo / mono selection
// added - 50us / 75us pre-emphasis selection
// added - transmission power adjustment
// added - TX volume control
// added - DSP volume control (via aplay and amixer)
// changed - error and help messages
// changed - lowered TX volume this helped to reduce background noise from PI USB power supply

#include <stdio.h>
#include <string.h>
#include <usb.h>
#include <errno.h>

extern int errnol;
usb_dev_handle  *keenehandle;

#define keeneVID  0x046d
#define keenePID  0x0a0e
#define tx_min_freq 8750  // Minimum frequency: Japan = 7600, USA = 8810,  UK/EU = 8750
#define tx_max_freq 10800 // Maximum frequency: Japan = 9000, USA = 10790, UK/EU = 10800
#define tx_off_freq 11400 // Out of range frequency will actual turn off the Transmitter

// ** cleanup() *****************************************************
void cleanup() {
    usb_set_debug(0);
    // if we have the USB device, hand it back
    if (keenehandle) {
        usb_release_interface(keenehandle,2);
        usb_close(keenehandle);
    }
    exit(errno);
}

void set_dsp(int volume_level) {
  FILE *fp;
  char output[2];
  char *cmd;
  int card_no = -1;
  int vol = volume_level;
  fp = popen("aplay -l | fgrep -i B-Link | awk '{ print substr($2,1,1) }'","r");
  fgets(output, sizeof output, fp);
  if (strcmp(output, "0") == 0) { card_no = 0; }
  if (atoi(output) > 0) { card_no = atoi(output); }
  pclose(fp);
  if (card_no == -1) {
    printf("Error: B-Link audio DSP not found\n");
    exit(1);
  }
  if (vol > 56) { vol = 56; }
  if (vol < 0) { vol = 0; }
  char str_vol[2];
  sprintf(str_vol, "%d", vol);
  strcpy(cmd,"amixer -c");
  strcat(cmd, output);
  strcat(cmd, " set PCM ");
  strcat(cmd, str_vol);
  strcat(cmd, " >/dev/null");
  system(cmd);
  exit(0);
}

usb_dev_handle * GetFirstDevice(int vendorid, int productid) {
  struct usb_bus    *bus;
  struct usb_device *dev;

  usb_dev_handle    *device_handle = NULL; // it's a null

  usb_init();
  usb_set_debug(0);     /* 3 is the max setting */

  usb_find_busses();
  usb_find_devices();

  // Loop through each bus and device until you find the first match
  // open it and return it's usb device handle

  for (bus = usb_busses; bus; bus = bus->next) {
    for (dev = bus->devices; dev; dev = dev->next) {
      //if (dev->descriptor.idVendor == vendorid && dev->descriptor.idProduct == productid) {
      if (dev->descriptor.idVendor == vendorid) {
    device_handle = usb_open(dev);
    //
    // No device found
    if(!device_handle) {
      return NULL;
    }
//    fprintf(stderr," + Found audio transmiter on bus %s dev %s\n", dev->bus->dirname, dev->filename);
    return (device_handle);
      }
    }
  }
  errno = ENOENT;       // No such device
  return (device_handle);
}

int help(char *prog, int more_options) {
 int freq_imin = tx_min_freq;
 int freq_imax = tx_max_freq;
 double freq_dmin = tx_min_freq / 100;
 double freq_dmax = tx_max_freq / 100;
if (more_options == 0) {
   printf("Usage: %s freq (MHz) i.e. 88.1, 99, 106.95\n",prog);
   printf("Or: %s --help (for more options)\n\n",prog);
  return 1;
} else
 {
   printf("Usage: %s [freq] [options]\n\n",prog);
   printf("[freq] [%.2f - %.2f](MHz) 88.1, 99, 106.95\n",freq_dmin,freq_dmax);
   printf("[freq] [%i - %i] as 8810, 9900, 10695\n",freq_imin, freq_imax);
   printf("[freq] off (disable FM transmitter)\n\n");
   printf("[Options] can omit [freq] except for DSP and TX power\n");
   printf("(FM mode) s, stereo,  m,  mono (default = Stereo)\n");
   printf("(Pre-emphasis) 50, 50us, 75, 75us (default = 50us)\n");
   printf("(Audio volume) v0, v1, v2, v3, v4, v5 (default = v1)\n");
   printf("(DSP volume) dsp [0 - 56] (default = dsp 52)\n");
   printf("[freq] (TX power) l, low, h, high (default = high)\n\n");
   return 0;
 }
}
int keene_sendget(usb_dev_handle *handle, char *senddata ) {
    unsigned char buf[64];
    int rc;

    memcpy(buf, senddata, 0x0000008);
    rc = usb_control_msg(handle, USB_TYPE_CLASS + USB_RECIP_INTERFACE, 0x0000009, 0x0000200, 0x0000002, buf, 0x0000008, 1000);
    //printf("30 control msg returned %d", rc);
    //printf("\n");

    if(rc < 0) {
            perror(" ! Transfer error");
        cleanup();
    }
}

// ** main() ********************************************************
int main(int argc, char *argv[]) {
    int rc;
    int freq_h;
    int freq_l;
    int freq_in = 0;
    int set_mode = 0;
    int valid_arg = 0;
    int tx_power = 0x78; // TX power (device power is either high or low it cannot adjust)
    int tx_pmax = 0x78; // 120
    int tx_pmin = 0x1e; // 30
    int tx_mode = 0x20; // steps: 0x00 = 0.2MHz, 0x10 = 0.1MHz, 0x20 = 0.05MHz
    int tx_volume = 2; // TX volume control (not DSP)
    if ((argc < 2) || (argc > 6)) {
      return help(argv[0],0);
    }
    freq_in = atoi(argv[1]);
    set_mode = 0;
    if ((argc > 2) && (strcmp(argv[1], "dsp") == 0)) { set_dsp(atoi(argv[2])); }
    if ((argc > 1) && (strcmp(argv[1], "m") == 0)) { set_mode = 1; valid_arg = 1; } // check for mono
    if ((argc > 2) && (strcmp(argv[2], "m") == 0)) { set_mode = 1; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "m") == 0)) { set_mode = 1; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "m") == 0)) { set_mode = 1; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "m") == 0)) { set_mode = 1; valid_arg = 1; }
    if ((argc > 1) && (strcmp(argv[1], "mono") == 0)) { set_mode = 1; valid_arg = 1; }
    if ((argc > 2) && (strcmp(argv[2], "mono") == 0)) { set_mode = 1; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "mono") == 0)) { set_mode = 1; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "mono") == 0)) { set_mode = 1; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "mono") == 0)) { set_mode = 1; valid_arg = 1; }

    if ((argc > 1) && (strcmp(argv[1], "s") == 0)) { set_mode = 0; valid_arg = 1; } // check for stereo
    if ((argc > 2) && (strcmp(argv[2], "s") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "s") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "s") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "s") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 1) && (strcmp(argv[1], "stereo") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 2) && (strcmp(argv[2], "stereo") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "stereo") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "stereo") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "stereo") == 0)) { set_mode = 0; valid_arg = 1; }

    tx_mode = tx_mode + set_mode;
    set_mode = 0;

    if ((argc > 1) && (strcmp(argv[1], "75us") == 0)) { set_mode = 4; valid_arg = 1; } // check for 75us pre-emphasis
    if ((argc > 2) && (strcmp(argv[2], "75us") == 0)) { set_mode = 4; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "75us") == 0)) { set_mode = 4; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "75us") == 0)) { set_mode = 4; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "75us") == 0)) { set_mode = 4; valid_arg = 1; }
    if ((argc > 1) && (strcmp(argv[1], "75") == 0)) { set_mode = 4; valid_arg = 1; }
    if ((argc > 2) && (strcmp(argv[2], "75") == 0)) { set_mode = 4; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "75") == 0)) { set_mode = 4; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "75") == 0)) { set_mode = 4; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "75") == 0)) { set_mode = 4; valid_arg = 1; }

    if ((argc > 1) && (strcmp(argv[1], "50us") == 0)) { set_mode = 0; valid_arg = 1; } // check for 50us pre-emphasis
    if ((argc > 2) && (strcmp(argv[2], "50us") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "50us") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "50us") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "50us") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 1) && (strcmp(argv[1], "50") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 2) && (strcmp(argv[2], "50") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "50") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "50") == 0)) { set_mode = 0; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "50") == 0)) { set_mode = 0; valid_arg = 1; }

    if ((argc > 1) && (strcmp(argv[1], "v0") == 0)) { tx_volume = 3; valid_arg = 1; } // volume preset 0
    if ((argc > 2) && (strcmp(argv[2], "v0") == 0)) { tx_volume = 3; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "v0") == 0)) { tx_volume = 3; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "v0") == 0)) { tx_volume = 3; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "v0") == 0)) { tx_volume = 3; valid_arg = 1; }

    if ((argc > 1) && (strcmp(argv[1], "v1") == 0)) { tx_volume = 2; valid_arg = 1; } // volume preset 1
    if ((argc > 2) && (strcmp(argv[2], "v1") == 0)) { tx_volume = 2; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "v1") == 0)) { tx_volume = 2; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "v1") == 0)) { tx_volume = 2; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "v1") == 0)) { tx_volume = 2; valid_arg = 1; }

    if ((argc > 1) && (strcmp(argv[1], "v2") == 0)) { tx_volume = 4; valid_arg = 1; } // volume preset 2
    if ((argc > 2) && (strcmp(argv[2], "v2") == 0)) { tx_volume = 4; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "v2") == 0)) { tx_volume = 4; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "v2") == 0)) { tx_volume = 4; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "v2") == 0)) { tx_volume = 4; valid_arg = 1; }

    if ((argc > 1) && (strcmp(argv[1], "v3") == 0)) { tx_volume = 16; valid_arg = 1; } // volume preset 3
    if ((argc > 2) && (strcmp(argv[2], "v3") == 0)) { tx_volume = 16; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "v3") == 0)) { tx_volume = 16; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "v3") == 0)) { tx_volume = 16; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "v3") == 0)) { tx_volume = 16; valid_arg = 1; }

    if ((argc > 1) && (strcmp(argv[1], "v4") == 0)) { tx_volume = 48; valid_arg = 1; } // volume preset 4
    if ((argc > 2) && (strcmp(argv[2], "v4") == 0)) { tx_volume = 48; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "v4") == 0)) { tx_volume = 48; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "v4") == 0)) { tx_volume = 48; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "v4") == 0)) { tx_volume = 48; valid_arg = 1; }

    if ((argc > 1) && (strcmp(argv[1], "v5") == 0)) { tx_volume = 80; valid_arg = 1; } // volume preset 5
    if ((argc > 2) && (strcmp(argv[2], "v5") == 0)) { tx_volume = 80; valid_arg = 1; }
    if ((argc > 3) && (strcmp(argv[3], "v5") == 0)) { tx_volume = 80; valid_arg = 1; }
    if ((argc > 4) && (strcmp(argv[4], "v5") == 0)) { tx_volume = 80; valid_arg = 1; }
    if ((argc > 5) && (strcmp(argv[5], "v5") == 0)) { tx_volume = 80; valid_arg = 1; }

    tx_mode = tx_mode + set_mode;

    if (strcmp(argv[1], "--help") == 0) {
        return help(argv[0],1);
    }
    double freq_d = strtod(argv[1],NULL);
    if (strcmp(argv[1], "off") == 0) { freq_in = tx_off_freq; tx_power = tx_pmin; valid_arg =2; }
    if ( freq_in < 200 ) { freq_in =(int)(freq_d * 100); }  // if < 200 assume decimal value is used
    if ((valid_arg == 0) && (freq_in != tx_off_freq)) {     // don't check range if special arguments are used
    if ((freq_in < tx_min_freq)||(freq_in > tx_max_freq)) { // check for frequency in range
          printf("Frequency out of range\n");
          cleanup();
        }
      }
    if ((argc > 1) && (strcmp(argv[1], "high") == 0)) { tx_power = tx_pmax; valid_arg = 3; } // check for high TX power
    if ((argc > 2) && (strcmp(argv[2], "high") == 0)) { tx_power = tx_pmax; valid_arg = 3; } 
    if ((argc > 3) && (strcmp(argv[3], "high") == 0)) { tx_power = tx_pmax; valid_arg = 3; }
    if ((argc > 4) && (strcmp(argv[4], "high") == 0)) { tx_power = tx_pmax; valid_arg = 3; }
    if ((argc > 5) && (strcmp(argv[5], "high") == 0)) { tx_power = tx_pmax; valid_arg = 3; }
    if ((argc > 6) && (strcmp(argv[6], "high") == 0)) { tx_power = tx_pmax; valid_arg = 3; }
    if ((argc > 1) && (strcmp(argv[1], "h") == 0)) { tx_power = tx_pmax; valid_arg = 3; }
    if ((argc > 2) && (strcmp(argv[2], "h") == 0)) { tx_power = tx_pmax; valid_arg = 3; }
    if ((argc > 3) && (strcmp(argv[3], "h") == 0)) { tx_power = tx_pmax; valid_arg = 3; }
    if ((argc > 4) && (strcmp(argv[4], "h") == 0)) { tx_power = tx_pmax; valid_arg = 3; }
    if ((argc > 5) && (strcmp(argv[5], "h") == 0)) { tx_power = tx_pmax; valid_arg = 3; }
    if ((argc > 6) && (strcmp(argv[6], "h") == 0)) { tx_power = tx_pmax; valid_arg = 3; }
    if ((argc > 1) && (strcmp(argv[1], "low") == 0)) { tx_power = tx_pmin; valid_arg = 3; } // check for low TX power
    if ((argc > 2) && (strcmp(argv[2], "low") == 0)) { tx_power = tx_pmin; valid_arg = 3; }
    if ((argc > 3) && (strcmp(argv[3], "low") == 0)) { tx_power = tx_pmin; valid_arg = 3; }
    if ((argc > 4) && (strcmp(argv[4], "low") == 0)) { tx_power = tx_pmin; valid_arg = 3; }
    if ((argc > 5) && (strcmp(argv[5], "low") == 0)) { tx_power = tx_pmin; valid_arg = 3; }
    if ((argc > 6) && (strcmp(argv[6], "low") == 0)) { tx_power = tx_pmin; valid_arg = 3; }
    if ((argc > 1) && (strcmp(argv[1], "l") == 0)) { tx_power = tx_pmin; valid_arg = 3; }
    if ((argc > 2) && (strcmp(argv[2], "l") == 0)) { tx_power = tx_pmin; valid_arg = 3; }
    if ((argc > 3) && (strcmp(argv[3], "l") == 0)) { tx_power = tx_pmin; valid_arg = 3; }
    if ((argc > 4) && (strcmp(argv[4], "l") == 0)) { tx_power = tx_pmin; valid_arg = 3; }
    if ((argc > 5) && (strcmp(argv[5], "l") == 0)) { tx_power = tx_pmin; valid_arg = 3; }
    if ((argc > 6) && (strcmp(argv[6], "l") == 0)) { tx_power = tx_pmin; valid_arg = 3; }

    if ((valid_arg == 3) && (argc == 2)) {
      printf("Error: you must set the frequency before adjusting TX power\n");
      return 1;
    }

    unsigned char hexdata[64];
    freq_in = ((freq_in - 7600)/5); // convert to counter ($0000 = 76MHz, $0001 = 76.05MHz etc)
    freq_h = (freq_in / 256);
    freq_l = (freq_in - (freq_h * 256));
    hexdata[0]=0x00;
    hexdata[1]=0x50;
    hexdata[2]=freq_h;
    hexdata[3]=freq_l;
    hexdata[4]=tx_power; 
    hexdata[5]=0x19;
    hexdata[6]=0x00;
    hexdata[7]=0x44; // 0x44 tune up, 0x4D tune down
    keenehandle = GetFirstDevice(keeneVID,keenePID);
    //fprintf (stderr,"%d freq_3 %x freqhex %s hexdata \n",freq_3,freq_3,hexdata);

    keenehandle = GetFirstDevice(keeneVID,keenePID);

    // Find the USB connect
    if (!keenehandle) {
        perror(" ! Error opening device!");
        exit(errno);
    }

    // See if we can talk to the device.
    rc = usb_claim_interface(keenehandle,2);
    // If not, we might need to wrestle the keene off the HID driver
    if (rc==-16) {
	    //need to grab the device the second bit of the HID device
            rc = usb_detach_kernel_driver_np(keenehandle,2);
            if(rc < 0) {
                perror(" ! usbhid wouldn't let go?");
                cleanup();
            }
        // try again
        rc = usb_claim_interface(keenehandle,2);
    }

    // Claim the interface
    rc = usb_claim_interface(keenehandle,2);
    if(rc < 0) {
        perror(" ! Error claiming the interface(2) - you must run with root privileges");
        cleanup();
    }

    if (freq_in > 0) {
      if (valid_arg > 1) { // change tx power by tuning frequency out and in
        int temp_h,temp_l; // it cannot adjust power if frequency is unchanged
        temp_h = hexdata[2];
        temp_l = hexdata[3];
        freq_in = ((tx_off_freq - 7600)/5);
        freq_h = (freq_in / 256);
        freq_l = (freq_in - (freq_h * 256));
        hexdata[2]=freq_h;
        hexdata[3]=freq_l;
        keene_sendget(keenehandle,hexdata); // set TX to tx_freq_off
        hexdata[2] = temp_h;
        hexdata[3] = temp_l;
      }
      keene_sendget(keenehandle,hexdata); // set TX frequency
    }
    hexdata[0]=0x00;
    hexdata[1]=0x51;
    hexdata[2]=tx_volume;
    hexdata[3]=tx_mode;
    hexdata[4]=0x00;
    hexdata[5]=0x00;
    hexdata[6]=0x00;
    hexdata[7]=0x44;
    keene_sendget(keenehandle,hexdata); // set TX options

    cleanup();
}