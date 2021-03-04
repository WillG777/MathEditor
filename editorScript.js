var numFields = 1, numComments = 0;
var borders = true, hidden=false;
var currentField = 'field1';
var currentIndex = 0;
var inputs = {ctrl: false, up: false, down: false, slash: false, enter: false, bs: false, s: false};
var fields = [];

function configOptions() {
  return {
    leftRightIntoCmdGoes: 'up',
    charsThatBreakOutOfSupSub: '=<>',
    autoCommands: 'pi theta sqrt sum int infty',
    handlers: {
      enter: onEnter,
      moveOutOf: dir => {
        if (dir === MQ.R) moveDown(); else moveUp();
      },
      upOutOf: moveUp,
      downOutOf: moveDown,
      deleteOutOf: deleteField
    }
  };
}

$(()=>{
  console.log('page loaded');
  // create new field and push to []fields
  var field = MQ.MathField(document.getElementById('field1'), configOptions());
  fields.push({field: field, id: 'field1'});
  field.focus();

  // keyboard handlers
  $(document).on('keydown', evt => {
    if (evt.key === 'Control') inputs.ctrl = true;
    else if (evt.key === 'ArrowUp') inputs.up = true;
    else if (evt.key === 'ArrowDown') inputs.down = true;
    else if (evt.key === '/') inputs.slash = true;
    else if (evt.key === 'Enter') inputs.enter = true;
    else if (evt.key === 'Backspace') inputs.bs = true;
    else if (evt.key === 's') inputs.s = true;
  });
  $(document).on('keyup', evt => {
    if (evt.key === 'Control') inputs.ctrl = false;
    else if (evt.key === 'ArrowUp') inputs.up = false;
    else if (evt.key === 'ArrowDown') inputs.down = false;
    else if (evt.key === '/') inputs.slash = false;
    else if (evt.key === 'Enter') inputs.enter = false;
    else if (evt.key === 'Backspace') inputs.bs = false;
    else if (evt.key === 's') inputs.s = false;
  });
  $('.field').focusin(updateFocus);

  // functions based on keyboard inputs
  setInterval(function(){
    if (inputs.ctrl && inputs.slash) {
      inputs.slash = false;
      let elem = $(`<input type="text" class="comment" id="comment${++numComments}">`);
      elem.css('border', borders ? '1px solid #ccc' : 'none');
      elem.insertBefore($('#'+currentField));
      elem.focus();
      fields.splice(currentIndex, 0, {field: elem, id: 'comment'+numComments});
      currentField = 'comment'+numComments;
      $('.comment').focusin(updateFocus);
    }
    if (inputs.ctrl && inputs.bs) {
      deleteField(true);
    }
    if (inputs.enter && currentField[0] === 'c') {
      inputs.enter = false;
      onEnter();
    }
    if (inputs.ctrl && inputs.up) {
      moveUp();
    }
    else if (inputs.ctrl && inputs.down) {
      moveDown();
    }
    if (inputs.ctrl && inputs.s) {
      localStorage.manualBackup = exportLines();
    }
  },16);

  $('#btnBorder').click(evt => {
    if (borders) {
      $('.field, .comment').css('border', 'none');
    } else {
      $('.field, .comment').css('border', '1px solid #ccc')
    }
    borders = !borders;
  });
  $('#btnHeader').click(evt => {
    $('header').css('display', hidden ? 'block' : 'none');
    hidden = !hidden;
  });

  $('#btnExport').click(evt => {
    var output = exportLines();
    $('#exportOutput').css('display','block');
    $('#exportOutput p').html(output);
  });
  $('#btnHideExport').click(evt => {
    $('#exportOutput').css('display','none');
  });

  $('#btnImport').click(evt => {
    $('#import').css('display','block');
  });
  $('#btnHideImport').click(evt => {
    $('#import').css('display','none');
  });
  $('#btnSubmitImport').click(evt => {
    importFrom($('#import input')[0].value);
  });

  $('#btnSave').click(evt => {
    localStorage.manualBackup = exportLines();
  });
  $('#btnLoad').click(evt => {
    importFrom(localStorage.manualBackup);
  });
  $('#btnRestore').click(evt => {
    importFrom(localStorage.autoBackup0);
  });

  setInterval(function () {
    localStorage.autoBackup0 = String(localStorage.autoBackup1)
    localStorage.autoBackup1 = exportLines();
  }, 10000);
}); // end main function

// input as JSON string
function importFrom(input) {
  JSON.parse(input).forEach((line, i) => {
    if (line[0] === 'f') {
      let elem = $(`<div class="field" id="field${++numFields}"></div>`);
      $('main').append(elem);
      let field = MQ.MathField(document.getElementById('field'+numFields), configOptions());
      fields.push({field: field, id: 'field'+numFields});
      $('.field').focusin(updateFocus);
      if(!borders) elem.css('border','none');
      field.latex(line[1]);
    } else {
      let elem = $(`<input type="text" class="comment" id="comment${++numComments}" value="${line[1]}">`);
      $('main').append(elem);
      fields.push({field: elem, id: 'comment'+numComments});
      $('.comment').focusin(updateFocus);
    }
  });
}

function exportLines() {
  var output = [];
  fields.forEach(field => {
    if (field.id[0] === 'c') {
      output.push(['c', field.field[0].value]);
    } else {
      output.push(['f', field.field.latex()]);
    }
  });
  return JSON.stringify(output);
}
function updateFocus() {
  currentField = $(this).attr('id');
  console.log('Focused in elem: '+currentField);
  currentIndex = $(this).index();
}

function onEnter() {
  let elem = $(`<div class="field" id="field${++numFields}"></div>`);
  elem.insertAfter(document.getElementById(currentField));
  let field = MQ.MathField(document.getElementById('field'+numFields), configOptions());
  field.focus();
  fields.splice(currentIndex+1, 0, {field: field, id: 'field'+numFields});
  $('.field').focusin(updateFocus);
  currentField = elem.attr('id');
  currentIndex = elem.index();
  if(!borders) elem.css('border','none');
}
function moveUp() {
  inputs.up = false;
  if (currentIndex === 0) return;
  currentIndex--;
  fields[currentIndex].field.focus();
  currentField = fields[currentIndex].id;
}
function moveDown() {
  inputs.down = false;
  if (currentIndex === numFields+numComments-1) return;
  currentIndex++;
  fields[currentIndex].field.focus();
  currentField = fields[currentIndex].id;
}
function deleteField(ctrlPressed = -1) {
  inputs.bs = false;
  if (ctrlPressed !== -1 || !fields[currentIndex].field.latex()) {
    if (fields.length === 1) return;
    $('#'+currentField).remove();
    fields.splice(currentIndex, 1);
    fields[Math.max(currentIndex-1, 0)].field.focus();
    if (currentField[0] === 'f') numFields--; else numComments--;
  }
}
