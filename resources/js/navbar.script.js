/*
 * Handle User Related Modals.
 */

function login() {
    $.ajax({
        url: '/account/login',
        type: 'POST',
        data: {
            email: $('#email1').val(),
            password: $('#password1').val()
        },
        success: (result) => {
            location.reload()
        },
        error: (e) => {
            $("#login-errors").html(e.responseText);
        },
    });
};

function register() {
    $("#alert").html('');
    $("#errors").html('');
    if ($('#tos').prop('checked')) {
        $.ajax({
            url: '/account/register',
            type: 'POST',
            data: {
                email: $('#email1').val(),
                password: $('#password1').val(),
                password2: $('#password2').val()
            },
            success: (result) => {
                $("#register-errors").html('');
                $("#register-alert").html(result);
                $('#register-form').trigger("reset");
            },
            error: (e) => {
                $("#register-alert").html('');
                $("#register-errors").html(e.responseJSON.join('\n'));
                $('#password1').val('');
                $('#password2').val('');
            },
        });
    } else {
        $("#register-errors").html("You must read and accept the Terms of Service to continue");
        $('#password1').val('');
        $('#password2').val('');
    }
};

function forgotPassword() {
    $.ajax({
        url: '/account/forgot-password',
        type: 'POST',
        data: {
            email: $('#email1').val(),
        },
        success: (result) => {
            $("#forgot-password-errors").html('');
            $("#forgot-password-alert").html(result);
            $('#forgot-password-form').trigger("reset");
        },
        error: (e) => {
            $("#forgot-password-alert").html('');
            $("#forgot-password-errors").html(e.responseJSON.join('\n'));
        },
    });
};

function updateProfile() {
    $.ajax({
        url: '/account/update-profile',
        type: 'POST',
        data: {
            email: $('#email').val(),
            currentPassword: $('#currentpassword').val(),
            checked: $('#changepassword').prop('checked'),
            newPassword: $('#newpassword').val(),
            newPassword2: $('#newpassword2').val(),
        },
        success: (result) => {
            location.reload()
        },
        error: (e) => {
            $("#update-profile-errors").html(e.responseJSON.join('\n'));
        },
    });
};