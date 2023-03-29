import { sseFetch } from "./sse-fetch.js";

let CONTEXTS = [];
let ANSWERTEXT = [];
let ANSWERDONE = true;
let ANSWERERROR = false;
let ANSWERTEXTDONE = true;

function chat() {
    const thisbtn = $("#btn-ask");
    const question = $("#question").val();
    const request = { "role": "user", "content": question };
    const newId = new Date().valueOf();

    $("#conversation").append(`
<div class="card">
  <div class="card-body">
  <h6 class="card-title">${question}</h6>
  <div id="r-${newId}">
  <h6 class="card-subtitle text-primary">AI 思考中。。。</h6>
  </div>
  </div>
</div>`);

    CONTEXTS.push(request);
    $(document).scrollTop($(document).height());
    $("#question").val("");
    thisbtn.prop("disabled", true);

    $.ajax({
        url: "/chat",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(CONTEXTS)
    }).done(function (d) {
        $(`#r-${newId}`).html(d.msg);
        if (CONTEXTS.length >= 6) {
            CONTEXTS.shift();
        }
        CONTEXTS.push({ "role": "assistant", "content": d.msg }); // system, user, assistant 
    }).fail(function () {
        $(`#r-${newId}`).addClass("text-danger").html("AI放弃思考，请重新提问。");
        CONTEXTS.pop(); // remove last error question
    }).always(function () {
        thisbtn.prop("disabled", false);
        $(document).scrollTop($(document).height());
        if (CONTEXTS.length >= 6) {
            CONTEXTS.shift();
        }
    })
}

function streamChat() {
    if (!ANSWERDONE || !ANSWERTEXTDONE) {
        return;
    }

    const thisbtn = $("#btn-ask");
    const question = $("#question").val();
    const request = { "role": "user", "content": question };
    const newId = new Date().valueOf();
    ANSWERDONE = false;
    ANSWERERROR = false;
    ANSWERTEXTDONE = false;

    $("#conversation").append(`
<div class="card">
  <div class="card-body">
  <h6 class="card-title">${question}</h6>
  <div class="chat-answer" id="r-${newId}">
  </div>
  </div>
</div>`);

    CONTEXTS.push(request);
    $(document).scrollTop($(document).height());
    $("#question").val("");
    thisbtn.prop("disabled", true);

    sseFetch('/streaming', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(CONTEXTS),
        onmessage(msg) {
            if (msg.data === "[DONE]" || msg.data === "[ERROR]") {
                ANSWERDONE = true;
                return;
            }
            const data = JSON.parse(msg.data);
            if (data.content) {
                ANSWERTEXT.push({ id: newId, content: data.content });
            }
        },
        onerror(err) {
            $(`#r-${newId}`).append('<br/><span class="text-danger">AI放弃思考，请重新提问。</span>');
            $(`#r-${newId}`).attr('error', 'error');
            CONTEXTS.pop(); // remove last error question
            ANSWERDONE = true;
            ANSWERERROR = true;
        },
        onclose() {
            $(document).scrollTop($(document).height());

            if ($(`#r-${newId}`).attr('error') === 'error') {
                return;
            }
        }
    });
}

// to make text display a lit bit slower
window.setInterval(function () {
    if (ANSWERERROR) {
        ANSWERTEXT.length = 0;
    }
    if (ANSWERTEXT.length > 0) {
        const item = ANSWERTEXT.shift()
        $(`#r-${item.id}`).append(item.content);
        $(document).scrollTop($(document).height());

        if (ANSWERDONE && ANSWERTEXT.length === 0) {
            CONTEXTS.push({ "role": "assistant", "content": $(`#r-${item.id}`).html() });
            $("#btn-ask").prop("disabled", false);
            ANSWERTEXTDONE = true;
        }
    }
}, 50);

$("#btn-ask").on("click", function () {
    streamChat();
});
$("#question").on("keydown", function (event) {
    if (event.which == 13 && event.shiftKey) {
        // Cancel the default action, if needed
        event.preventDefault();
        $("#question").blur();
        streamChat();
    }
});