'use babel';
import {CompositeDisposable, Point, Range} from 'atom';

export default {
  config: {
    single: {
      title: 'Single Brackets',
      description: 'Enable spaces after single brackets when there\'s an import statement or enable always ',
      type: 'string',
      default: 'disabled',
      enum: ['disabled', 'only-imports', 'always']
    },
    paste: {
      title: 'Pasted text',
      description: 'Enable spaces after brackets on pasted text',
      type: 'string',
      default: 'disabled',
      enum: ['disabled','enabled']
    }
  },
  subscriptions: null,

  activate (state) {
    this.subscriptions = new CompositeDisposable();
    const workspaceDisposable = atom.workspace.observeTextEditors((editor) => {
      const buffer = editor.getBuffer();
      const config = atom.config.get('double-brackets-with-spaces');
      const didChangeDisposable = buffer.onDidStopChanging(event => {
        const activeEditor = atom.workspace.getActiveTextEditor();
        if (event.changes.length && activeEditor && activeEditor.id === editor.id) {
          event.changes.map(change => {
            if (config.paste !== 'disabled' || config.paste === 'disabled'  && change.newText !== atom.clipboard.read()) {
              change.newText.split('\n').map((text, index) => {
                this.insertSpaces(editor, buffer, text, change.start.column, index + change.start.row);
              });
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
  },
  insertSpaces (editor, buffer, text, column, row) {
    const config = atom.config.get('double-brackets-with-spaces');
    const regGroup = '([^\\s^{^}][^{^}]*[^\\s^{^}])?';
    let regex = `{{${regGroup}}}`; // {{([^\s^{^}][^{^}]*[^\s^{^}])?}}

    if (config.single === 'always' || config.single === 'only-imports' && ~buffer.getLines()[row].indexOf('import')) {
      regex = regex + `|{${regGroup}}` // {{([^\s^{^}][^{^}]*[^\s^{^}])?}}|{([^\s^{^}][^{^}]*[^\s^{^}])?}
    }

    regex = new RegExp(regex, 'gi');

    let lineMatches = -1;
    while ((match = regex.exec(text)) != null) {
      lineMatches++;
      let col = column | match.index;
      if (!match[1] && !match[2]) {
        const offset = match[0].length / 2;
        const point = new Point(row, col + offset + lineMatches * 2);
        buffer.insert(point, '  ');
        editor.moveLeft(1);
        continue;
      }

      const group = match[1] || match[2];
      const offset = (match[0].length - group.length ) / 2 + lineMatches * 2;
      const point1 = new Point(row, col + offset);
      const point2 = new Point(row, col + offset + 1 + group.length);
      buffer.insert(point1, ' ');
      buffer.insert(point2, ' ');
    }
  }
};
