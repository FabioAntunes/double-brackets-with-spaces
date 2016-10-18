' use babel';
import {CompositeDisposable, Point, Range} from 'atom';

export default {
  config: {
    singleBrackets: {
      title: 'Single Brackets',
      description: 'Enable spaces after single brackets when there\'s an import statement or enable always ',
      type: 'string',
      default: 'disabled',
      enum: ['disabled', 'only-imports', 'always']
    }
  },
  subscriptions: null,

  activate (state) {
    this.subscriptions = new CompositeDisposable();
    const workspaceDisposable = atom.workspace.observeTextEditors((editor) => {
      const buffer = editor.getBuffer();
      const didChangeDisposable = buffer.onDidStopChanging(event => {
        if (event.changes.length) {
          event.changes.map(change => {
            this._checkSingleBrackets(editor, change, buffer);
            this._checkDoubleBrackets(editor, change, buffer);
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
  _checkSingleBrackets (editor, change, buffer) {
    const config = atom.config.get('double-brackets-with-spaces');
    const offset = 1;
    if(config.singleBrackets === 'always' || config.singleBrackets === 'only-imports' && ~buffer.lines[change.start.row].indexOf('import')) {
      if (change.newText === '{}') {
        this._insertSpacesAfterPoint(editor, change, buffer, offset);
        return;
      }

      const regex = /{([^\s][^}]*[^\s])}/i;
      this._insertSpacesBetweenPoints(editor, change, buffer, offset, regex);
    }
  },
  _checkDoubleBrackets (editor, change, buffer) {
    const offset = 2;
    if (change.newText === '{{}}') {
      this._insertSpacesAfterPoint(editor, change, buffer, offset);
      return;
    }

    const regex = /{{([^\s][^}]*[^\s])}}/i;
    this._insertSpacesBetweenPoints(editor, change, buffer, offset, regex);
  },
  _insertSpacesAfterPoint (editor, change, buffer, offset) {
    const point = new Point(change.start.row, change.start.column + offset);
    buffer.insert(point, '  ');
    editor.moveLeft(1);
  },
  _insertSpacesBetweenPoints (editor, change, buffer, offset, regex) {
    const match = change.newText.match(regex) || [];
    if (match.length) {
      const point1 = new Point(change.start.row, change.start.column + offset);
      const point2 = new Point(change.start.row, change.start.column + offset + 1 + match[1].length);
      buffer.insert(point1, ' ');
      buffer.insert(point2, ' ');
    }
  }
};
