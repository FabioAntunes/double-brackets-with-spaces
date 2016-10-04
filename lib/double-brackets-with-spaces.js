'use babel';

import {CompositeDisposable, Point, Range} from 'atom';

export default {

  subscriptions: null,

  activate (state) {
    const regex = /{{([^\s][^}]*[^\s])}}/i;
    this.subscriptions = new CompositeDisposable();
    const workspaceDisposable = atom.workspace.observeTextEditors((editor) => {
      const buffer = editor.getBuffer();
      const didChangeDisposable = buffer.onDidStopChanging(event => {
        if (event.changes.length) {
          event.changes.map(change => {
            if (change.newText === '{{}}') {
              const point = new Point(change.start.row, change.start.column + 2);
              buffer.insert(point, '  ');
              editor.moveLeft(1);
              return;
            }

            const match = change.newText.match(regex) || [];
            if (match.length) {
              const point = new Point(change.start.row, change.start.column + 2);
              const point2 = new Point(change.start.row, change.start.column + 3 + match[1].length);
              buffer.insert(point, ' ');
              buffer.insert(point2, ' ');
            }
          });
        }
      });
      this.subscriptions.add(didChangeDisposable);
    });
    this.subscriptions.add(workspaceDisposable);
  },

  deactivate () {
    this.subscriptions.dispose();
  }
};
