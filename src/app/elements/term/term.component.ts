import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {ElementRef} from '@angular/core';
import {term, Terminal, TermWS} from '../../globals';
import {Cookie} from 'ng2-cookies/ng2-cookies';
import {NavList} from '../../ControlPage/control/control.component';
import * as jQuery from 'jquery/dist/jquery.min.js';
import * as UUID from 'uuid-js/lib/uuid.js';

@Component({
  selector: 'app-element-term',
  templateUrl: './term.component.html',
  styleUrls: ['./term.component.css']
})
export class ElementTermComponent implements OnInit, AfterViewInit {
  @Input() host: any;
  @Input() userid: any;
  @Input() index: number;
  // @Input() room: string;
  @ViewChild('term') el: ElementRef;
  secret: string;
  term: any;

  constructor() {
  }

  ngOnInit() {
    this.secret = UUID.create()['hex'];
    this.term = Terminal({
      cols: 80,
      rows: 24,
      useStyle: true,
      screenKeys: true,
    });
    // NavList.List[this.index].room = this.room;
  }

  ngAfterViewInit() {
    if (this.host) {
      if (Cookie.get('cols')) {
        term.col = parseInt(Cookie.get('cols'), 10);
      }
      if (Cookie.get('rows')) {
        term.row = parseInt(Cookie.get('rows'), 10);
      }
    } else {
      term.col = Math.floor(jQuery(this.el.nativeElement).width() / jQuery('#liuzheng').width() * 8) - 3;
      term.row = Math.floor(jQuery(this.el.nativeElement).height() / jQuery('#liuzheng').height()) - 3;
      term.term = this.term;
    }
    this.term.open(this.el.nativeElement, true);
    const that = this;
    window.onresize = function () {
      term.col = Math.floor(jQuery(that.el.nativeElement).width() / jQuery('#liuzheng').width() * 8) - 3;
      term.row = Math.floor(jQuery(that.el.nativeElement).height() / jQuery('#liuzheng').height()) - 3;
      if (term.col < 80) {
        term.col = 80;
      }
      if (term.row < 24) {
        term.row = 24;
      }
      that.term.resize(term.col, term.row);
      if (that.host) {
        Cookie.set('cols', term.col.toString(), 99, '/', document.domain);
        Cookie.set('rows', term.row.toString(), 99, '/', document.domain);
        TermWS.emit('resize', {'cols': term.col, 'rows': term.row});
      }
    };
    jQuery(window).resize();

    if (this.host) {
      NavList.List[this.index].Term = this.term;

      this.term.write('\x1b[31mWelcome to Jumpserver!\x1b[m\r\n');

      TermWS.emit('host', {'uuid': this.host.id, 'userid': this.userid, 'secret': this.secret});

      this.term.on('data', function (data) {
        TermWS.emit('data', {'data': data, 'room': NavList.List[that.index].room});
      });

      TermWS.on('data', function (data) {
        if (data['room'] === NavList.List[that.index].room) {
          that.term.write(data['data']);
        }
      });

      TermWS.on('disconnect', function () {
        that.TerminalDisconnect();
      });
      TermWS.on('room', function (data) {
        if (data['secret'] === that.secret) {
          NavList.List[that.index].room = data['room'];
        }
      });
    }
  }

  TerminalDisconnect() {
    NavList.List[this.index].connected = false;
    this.term.write('\r\n\x1b[31mBye Bye!\x1b[m\r\n');
    TermWS.emit('logout', NavList.List[this.index].room);
  }
}
