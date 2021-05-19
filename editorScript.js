var numFields = 1, numComments = 0;
var borders = true, hidden=false;
var currentField = 'field1';
var currentIndex = 0;
var fields = [];
var autoCommands = localStorage.autoCommands ? JSON.parse(localStorage.autoCommands) : ['pi', 'theta', 'sqrt', 'sum', 'infty'];

const configOptions = () => ({
  leftRightIntoCmdGoes: 'up',
  charsThatBreakOutOfSupSub: '=<>',
  autoCommands: autoCommands.join(' '),
  handlers: {
    enter: onEnter,
    moveOutOf: dir => {
      if (dir === MQ.R) moveDown(); else moveUp();
    },
    upOutOf: moveUp,
    downOutOf: moveDown,
    deleteOutOf: deleteField
  }
});
MQ.config(configOptions());

$(()=>{
  console.log('page loaded');
  // create new field and push to []fields
  var field = MQ.MathField(document.getElementById('field1'));
  fields.push({field: field, id: 'field1'});
  field.focus();

  // keyboard handlers

  $(document).on('keydown', evt => {
    switch(evt.key) {
      case '/': case '?':
        if (!evt.ctrlKey) break;
        let elem = $(`<input type="text" class="comment" id="comment${++numComments}">`);
        elem.css('border', borders ? '1px solid #ccc' : 'none');
        elem[evt.shiftKey ? 'insertAfter' : 'insertBefore']($('#'+currentField));
        elem.focus();
        currentField = 'comment'+numComments;
        currentIndex = elem.index();
        fields.splice(currentIndex, 0, {field: elem, id: 'comment'+numComments});
        $('.comment').focusin(updateFocus);
        break;
      case 'Backspace':
        if (!evt.ctrlKey) break;
        deleteField(true);
        break;
      case 'Enter':
        if (currentField[0] === 'c') onEnter();
        break;
      case 'ArrowUp':
        if (evt.ctrlKey) moveUp();
        break;
      case 'ArrowDown':
        if (evt.ctrlKey) moveDown();
        break;
      case 's':
        if (!evt.ctrlKey) break;
        localStorage.manualBackup = exportLines();
    }
  });
  $('.field').focusin(updateFocus);

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

  $('#btnSetAuto').click(evt => {
    $('#autoCommands').css('display', 'block');
  });
  $('#btnHideAutos').click(evt => {
    $('#autoCommands').css('display', 'none');
  });
  $('#btnAddAuto').click(evt => {
    let val = $('#inputAddAuto').val();
    if (!autoCommands.includes(val)) autoCommands.push(val);
    $('#inputAddAuto').val('');
    saveAutos();
  });
  $('#btnRemoveAuto').click(evt => {
    let val = $('#inputRemoveAuto').val();
    if (autoCommands.includes(val)) autoCommands.splice(autoCommands.indexOf(val), 1);
    $('#inputRemoveAuto').val('');
    saveAutos();
  });
  $('#currentAutos').text(autoCommands.join(' '))

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
      let field = MQ.MathField(document.getElementById('field'+numFields));
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
  let field = MQ.MathField(elem[0]);
  field.focus();
  $('.field').focusin(updateFocus);
  currentField = elem.attr('id');
  currentIndex = elem.index();
  fields.splice(currentIndex, 0, {field: field, id: 'field'+numFields});
  if(!borders) elem.css('border','none');
}
function moveUp() {
  if (currentIndex === 0) return;
  currentIndex--;
  fields[currentIndex].field.focus();
  currentField = fields[currentIndex].id;
}
function moveDown() {
  if (currentIndex === fields.length-1) return;
  currentIndex++;
  fields[currentIndex].field.focus();
  currentField = fields[currentIndex].id;
}
function deleteField(ctrlPressed = -1) {
  if (ctrlPressed !== -1 || !fields[currentIndex].field.latex()) {
    if (fields.length === 1) return;
    $('#'+currentField).remove();
    fields.splice(currentIndex, 1);
    fields[Math.max(currentIndex-1, 0)].field.focus();
    // if (currentField[0] === 'f') numFields--; else numComments--;
  }
}
function saveAutos() {
  localStorage.autoCommands = JSON.stringify(autoCommands);
  $('#currentAutos').text(autoCommands.join(' '))
  MQ.config(configOptions());
}
