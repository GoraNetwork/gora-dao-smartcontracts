import algosdk from "algosdk";
import * as bkr from "beaker-ts";
export class Vesting extends bkr.ApplicationClient {
    desc: string = "";
    override appSchema: bkr.Schema = { declared: { max_start: { type: bkr.AVMType.uint64, key: "mxs", desc: "", static: false }, min_timeframe: { type: bkr.AVMType.uint64, key: "mntf", desc: "", static: false }, max_timeframe: { type: bkr.AVMType.uint64, key: "mxtf", desc: "", static: false }, manager_address: { type: bkr.AVMType.bytes, key: "ma", desc: "", static: false } }, reserved: {} };
    override acctSchema: bkr.Schema = { declared: {}, reserved: {} };
    override approvalProgram: string = "I3ByYWdtYSB2ZXJzaW9uIDgKaW50Y2Jsb2NrIDAgMSAzMiA0IDU3NgpieXRlY2Jsb2NrIDB4IDB4NmQ2MSAweDAwIDB4NmQ3ODczIDB4NmQ2ZTc0NjYgMHg2ZDc4NzQ2NiAweDAxIDB4MDIKdHhuIE51bUFwcEFyZ3MKaW50Y18wIC8vIDAKPT0KYm56IG1haW5fbDIyCnR4bmEgQXBwbGljYXRpb25BcmdzIDAKcHVzaGJ5dGVzIDB4YThkMzY1ODUgLy8gImNyZWF0ZShhZGRyZXNzLHVpbnQ2NCx1aW50NjQsdWludDY0KXZvaWQiCj09CmJueiBtYWluX2wyMQp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweGE4ZmViZGIxIC8vICJ1cGRhdGVfdGltZV9jb25zdHJhaW50cyh1aW50NjQsdWludDY0LHVpbnQ2NCl2b2lkIgo9PQpibnogbWFpbl9sMjAKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMApwdXNoYnl0ZXMgMHgwNGVkZjdjNyAvLyAidXBkYXRlX21hbmFnZXJfYWRkcmVzcyhhZGRyZXNzKXZvaWQiCj09CmJueiBtYWluX2wxOQp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweDNjMTk3ZDE4IC8vICJvcHRpbl9hc3NldChwYXksYXNzZXQsYXBwbGljYXRpb24sYWRkcmVzcyl2b2lkIgo9PQpibnogbWFpbl9sMTgKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMApwdXNoYnl0ZXMgMHg1ODc2M2Q5MSAvLyAidmVzdF90b2tlbnMocGF5LGF4ZmVyLGFkZHJlc3MsdWludDY0LHVpbnQ2NCl2b2lkIgo9PQpibnogbWFpbl9sMTcKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMApwdXNoYnl0ZXMgMHhjYjk2OGM5NSAvLyAiY2xhaW1fdmVzdGluZyhhY2NvdW50LGFzc2V0KXZvaWQiCj09CmJueiBtYWluX2wxNgp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweDhhZDQ4N2MyIC8vICJzdGFrZV90b19kZWxlZ2F0b3IoYXBwbGljYXRpb24sYWRkcmVzcyxhcHBsaWNhdGlvbixhc3NldCxhY2NvdW50KXZvaWQiCj09CmJueiBtYWluX2wxNQp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweDc1N2E3ZjMyIC8vICJ3aXRoZHJhd19mcm9tX2RlbGVnYXRvcihhcHBsaWNhdGlvbixhZGRyZXNzLGFwcGxpY2F0aW9uLGFzc2V0LGFjY291bnQpdm9pZCIKPT0KYm56IG1haW5fbDE0CnR4bmEgQXBwbGljYXRpb25BcmdzIDAKcHVzaGJ5dGVzIDB4NzZlZjIxODQgLy8gImFkZF93aGl0ZWxpc3RlZF9hcHAocGF5LGFwcGxpY2F0aW9uKXZvaWQiCj09CmJueiBtYWluX2wxMwp0eG5hIEFwcGxpY2F0aW9uQXJncyAwCnB1c2hieXRlcyAweDVkM2ZhMjNiIC8vICJyZW1vdmVfd2hpdGVsaXN0ZWRfYXBwKGFwcGxpY2F0aW9uKXZvaWQiCj09CmJueiBtYWluX2wxMgplcnIKbWFpbl9sMTI6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KJiYKYXNzZXJ0CnR4bmEgQXBwbGljYXRpb25BcmdzIDEKaW50Y18wIC8vIDAKZ2V0Ynl0ZQpjYWxsc3ViIHJlbW92ZXdoaXRlbGlzdGVkYXBwXzE5CmludGNfMSAvLyAxCnJldHVybgptYWluX2wxMzoKdHhuIE9uQ29tcGxldGlvbgppbnRjXzAgLy8gTm9PcAo9PQp0eG4gQXBwbGljYXRpb25JRAppbnRjXzAgLy8gMAohPQomJgphc3NlcnQKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMQppbnRjXzAgLy8gMApnZXRieXRlCnN0b3JlIDI5CnR4biBHcm91cEluZGV4CmludGNfMSAvLyAxCi0Kc3RvcmUgMjgKbG9hZCAyOApndHhucyBUeXBlRW51bQppbnRjXzEgLy8gcGF5Cj09CmFzc2VydApsb2FkIDI4CmxvYWQgMjkKY2FsbHN1YiBhZGR3aGl0ZWxpc3RlZGFwcF8xOAppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sMTQ6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KJiYKYXNzZXJ0CnR4bmEgQXBwbGljYXRpb25BcmdzIDEKaW50Y18wIC8vIDAKZ2V0Ynl0ZQpzdG9yZSAyMwp0eG5hIEFwcGxpY2F0aW9uQXJncyAyCnN0b3JlIDI0CnR4bmEgQXBwbGljYXRpb25BcmdzIDMKaW50Y18wIC8vIDAKZ2V0Ynl0ZQpzdG9yZSAyNQp0eG5hIEFwcGxpY2F0aW9uQXJncyA0CmludGNfMCAvLyAwCmdldGJ5dGUKc3RvcmUgMjYKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgNQppbnRjXzAgLy8gMApnZXRieXRlCnN0b3JlIDI3CmxvYWQgMjMKbG9hZCAyNApsb2FkIDI1CmxvYWQgMjYKbG9hZCAyNwpjYWxsc3ViIHdpdGhkcmF3ZnJvbWRlbGVnYXRvcl8xNwppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sMTU6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KJiYKYXNzZXJ0CnR4bmEgQXBwbGljYXRpb25BcmdzIDEKaW50Y18wIC8vIDAKZ2V0Ynl0ZQpzdG9yZSAxOAp0eG5hIEFwcGxpY2F0aW9uQXJncyAyCnN0b3JlIDE5CnR4bmEgQXBwbGljYXRpb25BcmdzIDMKaW50Y18wIC8vIDAKZ2V0Ynl0ZQpzdG9yZSAyMAp0eG5hIEFwcGxpY2F0aW9uQXJncyA0CmludGNfMCAvLyAwCmdldGJ5dGUKc3RvcmUgMjEKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgNQppbnRjXzAgLy8gMApnZXRieXRlCnN0b3JlIDIyCmxvYWQgMTgKbG9hZCAxOQpsb2FkIDIwCmxvYWQgMjEKbG9hZCAyMgpjYWxsc3ViIHN0YWtldG9kZWxlZ2F0b3JfMTYKaW50Y18xIC8vIDEKcmV0dXJuCm1haW5fbDE2Ogp0eG4gT25Db21wbGV0aW9uCmludGNfMCAvLyBOb09wCj09CnR4biBBcHBsaWNhdGlvbklECmludGNfMCAvLyAwCiE9CiYmCmFzc2VydAp0eG5hIEFwcGxpY2F0aW9uQXJncyAxCmludGNfMCAvLyAwCmdldGJ5dGUKc3RvcmUgMTYKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMgppbnRjXzAgLy8gMApnZXRieXRlCnN0b3JlIDE3CmxvYWQgMTYKbG9hZCAxNwpjYWxsc3ViIGNsYWltdmVzdGluZ18xNQppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sMTc6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KJiYKYXNzZXJ0CnR4bmEgQXBwbGljYXRpb25BcmdzIDEKc3RvcmUgMTMKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMgpidG9pCnN0b3JlIDE0CnR4bmEgQXBwbGljYXRpb25BcmdzIDMKYnRvaQpzdG9yZSAxNQp0eG4gR3JvdXBJbmRleApwdXNoaW50IDIgLy8gMgotCnN0b3JlIDExCmxvYWQgMTEKZ3R4bnMgVHlwZUVudW0KaW50Y18xIC8vIHBheQo9PQphc3NlcnQKdHhuIEdyb3VwSW5kZXgKaW50Y18xIC8vIDEKLQpzdG9yZSAxMgpsb2FkIDEyCmd0eG5zIFR5cGVFbnVtCmludGNfMyAvLyBheGZlcgo9PQphc3NlcnQKbG9hZCAxMQpsb2FkIDEyCmxvYWQgMTMKbG9hZCAxNApsb2FkIDE1CmNhbGxzdWIgdmVzdHRva2Vuc18xNAppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sMTg6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KJiYKYXNzZXJ0CnR4bmEgQXBwbGljYXRpb25BcmdzIDEKaW50Y18wIC8vIDAKZ2V0Ynl0ZQpzdG9yZSA4CnR4bmEgQXBwbGljYXRpb25BcmdzIDIKaW50Y18wIC8vIDAKZ2V0Ynl0ZQpzdG9yZSA5CnR4bmEgQXBwbGljYXRpb25BcmdzIDMKc3RvcmUgMTAKdHhuIEdyb3VwSW5kZXgKaW50Y18xIC8vIDEKLQpzdG9yZSA3CmxvYWQgNwpndHhucyBUeXBlRW51bQppbnRjXzEgLy8gcGF5Cj09CmFzc2VydApsb2FkIDcKbG9hZCA4CmxvYWQgOQpsb2FkIDEwCmNhbGxzdWIgb3B0aW5hc3NldF8xMwppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sMTk6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KJiYKYXNzZXJ0CnR4bmEgQXBwbGljYXRpb25BcmdzIDEKY2FsbHN1YiB1cGRhdGVtYW5hZ2VyYWRkcmVzc18xMgppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sMjA6CnR4biBPbkNvbXBsZXRpb24KaW50Y18wIC8vIE5vT3AKPT0KdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KJiYKYXNzZXJ0CnR4bmEgQXBwbGljYXRpb25BcmdzIDEKYnRvaQpzdG9yZSA0CnR4bmEgQXBwbGljYXRpb25BcmdzIDIKYnRvaQpzdG9yZSA1CnR4bmEgQXBwbGljYXRpb25BcmdzIDMKYnRvaQpzdG9yZSA2CmxvYWQgNApsb2FkIDUKbG9hZCA2CmNhbGxzdWIgdXBkYXRldGltZWNvbnN0cmFpbnRzXzExCmludGNfMSAvLyAxCnJldHVybgptYWluX2wyMToKdHhuIE9uQ29tcGxldGlvbgppbnRjXzAgLy8gTm9PcAo9PQp0eG4gQXBwbGljYXRpb25JRAppbnRjXzAgLy8gMAo9PQomJgphc3NlcnQKdHhuYSBBcHBsaWNhdGlvbkFyZ3MgMQpzdG9yZSAwCnR4bmEgQXBwbGljYXRpb25BcmdzIDIKYnRvaQpzdG9yZSAxCnR4bmEgQXBwbGljYXRpb25BcmdzIDMKYnRvaQpzdG9yZSAyCnR4bmEgQXBwbGljYXRpb25BcmdzIDQKYnRvaQpzdG9yZSAzCmxvYWQgMApsb2FkIDEKbG9hZCAyCmxvYWQgMwpjYWxsc3ViIGNyZWF0ZV8xMAppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sMjI6CnR4biBPbkNvbXBsZXRpb24KaW50Y18xIC8vIE9wdEluCj09CmJueiBtYWluX2wyOAp0eG4gT25Db21wbGV0aW9uCmludGNfMyAvLyBVcGRhdGVBcHBsaWNhdGlvbgo9PQpibnogbWFpbl9sMjcKdHhuIE9uQ29tcGxldGlvbgpwdXNoaW50IDUgLy8gRGVsZXRlQXBwbGljYXRpb24KPT0KYm56IG1haW5fbDI2CmVycgptYWluX2wyNjoKdHhuIEFwcGxpY2F0aW9uSUQKaW50Y18wIC8vIDAKIT0KYXNzZXJ0CmNhbGxzdWIgZGVsZXRlXzIKaW50Y18xIC8vIDEKcmV0dXJuCm1haW5fbDI3Ogp0eG4gQXBwbGljYXRpb25JRAppbnRjXzAgLy8gMAohPQphc3NlcnQKY2FsbHN1YiB1cGRhdGVfMQppbnRjXzEgLy8gMQpyZXR1cm4KbWFpbl9sMjg6CnR4biBBcHBsaWNhdGlvbklECmludGNfMCAvLyAwCiE9CmFzc2VydApjYWxsc3ViIG9wdGluXzAKaW50Y18xIC8vIDEKcmV0dXJuCgovLyBvcHRfaW4Kb3B0aW5fMDoKcHJvdG8gMCAwCmludGNfMCAvLyAwCnJldHVybgoKLy8gdXBkYXRlCnVwZGF0ZV8xOgpwcm90byAwIDAKaW50Y18wIC8vIDAKcmV0dXJuCgovLyBkZWxldGUKZGVsZXRlXzI6CnByb3RvIDAgMAppbnRjXzAgLy8gMApyZXR1cm4KCi8vIGF1dGhfb25seQphdXRob25seV8zOgpwcm90byAxIDEKZnJhbWVfZGlnIC0xCmJ5dGVjXzEgLy8gIm1hIgphcHBfZ2xvYmFsX2dldAo9PQpyZXRzdWIKCi8vIGF1dGhfb25seQphdXRob25seV80Ogpwcm90byAxIDEKZnJhbWVfZGlnIC0xCmJ5dGVjXzEgLy8gIm1hIgphcHBfZ2xvYmFsX2dldAo9PQpyZXRzdWIKCi8vIGF1dGhfb25seQphdXRob25seV81Ogpwcm90byAxIDEKZnJhbWVfZGlnIC0xCmJ5dGVjXzEgLy8gIm1hIgphcHBfZ2xvYmFsX2dldAo9PQpyZXRzdWIKCi8vIGF1dGhfb25seQphdXRob25seV82Ogpwcm90byAxIDEKZnJhbWVfZGlnIC0xCmJ5dGVjXzEgLy8gIm1hIgphcHBfZ2xvYmFsX2dldAo9PQpyZXRzdWIKCi8vIGF1dGhfb25seQphdXRob25seV83Ogpwcm90byAxIDEKZnJhbWVfZGlnIC0xCmJ5dGVjXzEgLy8gIm1hIgphcHBfZ2xvYmFsX2dldAo9PQpyZXRzdWIKCi8vIHNlbmRfYXNzZXQKc2VuZGFzc2V0Xzg6CnByb3RvIDQgMAppdHhuX2JlZ2luCmludGNfMyAvLyBheGZlcgppdHhuX2ZpZWxkIFR5cGVFbnVtCmZyYW1lX2RpZyAtNAppdHhuX2ZpZWxkIFhmZXJBc3NldApmcmFtZV9kaWcgLTMKaXR4bl9maWVsZCBBc3NldFJlY2VpdmVyCmZyYW1lX2RpZyAtMgppdHhuX2ZpZWxkIEFzc2V0QW1vdW50CmZyYW1lX2RpZyAtMQppdHhuX2ZpZWxkIEZlZQppdHhuX3N1Ym1pdApyZXRzdWIKCi8vIHNlbmRfYWxnbwpzZW5kYWxnb185Ogpwcm90byAzIDAKaXR4bl9iZWdpbgppbnRjXzEgLy8gcGF5Cml0eG5fZmllbGQgVHlwZUVudW0KZnJhbWVfZGlnIC0zCml0eG5fZmllbGQgUmVjZWl2ZXIKZnJhbWVfZGlnIC0yCml0eG5fZmllbGQgQW1vdW50CmZyYW1lX2RpZyAtMQppdHhuX2ZpZWxkIEZlZQppdHhuX3N1Ym1pdApyZXRzdWIKCi8vIGNyZWF0ZQpjcmVhdGVfMTA6CnByb3RvIDQgMApieXRlY18zIC8vICJteHMiCmludGNfMCAvLyAwCmFwcF9nbG9iYWxfcHV0CmJ5dGVjIDQgLy8gIm1udGYiCmludGNfMCAvLyAwCmFwcF9nbG9iYWxfcHV0CmJ5dGVjIDUgLy8gIm14dGYiCmludGNfMCAvLyAwCmFwcF9nbG9iYWxfcHV0CmJ5dGVjXzEgLy8gIm1hIgpnbG9iYWwgQ3JlYXRvckFkZHJlc3MKYXBwX2dsb2JhbF9wdXQKZnJhbWVfZGlnIC00Cmdsb2JhbCBaZXJvQWRkcmVzcwohPQphc3NlcnQKZnJhbWVfZGlnIC00CmxlbgppbnRjXzIgLy8gMzIKPT0KYXNzZXJ0CmZyYW1lX2RpZyAtMgpmcmFtZV9kaWcgLTEKPD0KYXNzZXJ0CmJ5dGVjXzEgLy8gIm1hIgpmcmFtZV9kaWcgLTQKYXBwX2dsb2JhbF9wdXQKYnl0ZWNfMyAvLyAibXhzIgpmcmFtZV9kaWcgLTMKYXBwX2dsb2JhbF9wdXQKYnl0ZWMgNCAvLyAibW50ZiIKZnJhbWVfZGlnIC0yCmFwcF9nbG9iYWxfcHV0CmJ5dGVjIDUgLy8gIm14dGYiCmZyYW1lX2RpZyAtMQphcHBfZ2xvYmFsX3B1dApyZXRzdWIKCi8vIHVwZGF0ZV90aW1lX2NvbnN0cmFpbnRzCnVwZGF0ZXRpbWVjb25zdHJhaW50c18xMToKcHJvdG8gMyAwCnR4biBTZW5kZXIKY2FsbHN1YiBhdXRob25seV8zCi8vIHVuYXV0aG9yaXplZAphc3NlcnQKYnl0ZWNfMyAvLyAibXhzIgpmcmFtZV9kaWcgLTMKYXBwX2dsb2JhbF9wdXQKYnl0ZWMgNCAvLyAibW50ZiIKZnJhbWVfZGlnIC0yCmFwcF9nbG9iYWxfcHV0CmJ5dGVjIDUgLy8gIm14dGYiCmZyYW1lX2RpZyAtMQphcHBfZ2xvYmFsX3B1dApyZXRzdWIKCi8vIHVwZGF0ZV9tYW5hZ2VyX2FkZHJlc3MKdXBkYXRlbWFuYWdlcmFkZHJlc3NfMTI6CnByb3RvIDEgMAp0eG4gU2VuZGVyCmNhbGxzdWIgYXV0aG9ubHlfNAovLyB1bmF1dGhvcml6ZWQKYXNzZXJ0CmZyYW1lX2RpZyAtMQpnbG9iYWwgWmVyb0FkZHJlc3MKIT0KYXNzZXJ0CmZyYW1lX2RpZyAtMQpsZW4KaW50Y18yIC8vIDMyCj09CmFzc2VydApieXRlY18xIC8vICJtYSIKZnJhbWVfZGlnIC0xCmFwcF9nbG9iYWxfcHV0CnJldHN1YgoKLy8gb3B0aW5fYXNzZXQKb3B0aW5hc3NldF8xMzoKcHJvdG8gNCAwCmludGNfMCAvLyAwCmJ5dGVjXzAgLy8gIiIKaW50Y18wIC8vIDAKZHVwCmZyYW1lX2RpZyAtMQpieXRlY18wIC8vICIiCj09CmFzc2VydApieXRlY18wIC8vICIiCmZyYW1lX2RpZyAtMwp0eG5hcyBBc3NldHMKYXNzZXRfaG9sZGluZ19nZXQgQXNzZXRCYWxhbmNlCnN0b3JlIDMxCnN0b3JlIDMwCmxvYWQgMzEKaW50Y18xIC8vIDEKPT0KYXNzZXJ0CmZyYW1lX2RpZyAtMwp0eG5hcyBBc3NldHMKZnJhbWVfYnVyeSAwCmdsb2JhbCBDdXJyZW50QXBwbGljYXRpb25BZGRyZXNzCmZyYW1lX2J1cnkgMQpmcmFtZV9kaWcgMQpsZW4KaW50Y18yIC8vIDMyCj09CmFzc2VydApmcmFtZV9kaWcgMQptaW5fYmFsYW5jZQpmcmFtZV9idXJ5IDIKZnJhbWVfZGlnIDAKZnJhbWVfZGlnIDEKaW50Y18wIC8vIDAKaW50Y18wIC8vIDAKY2FsbHN1YiBzZW5kYXNzZXRfOApmcmFtZV9kaWcgMQptaW5fYmFsYW5jZQpmcmFtZV9kaWcgMgotCmZyYW1lX2J1cnkgMwpmcmFtZV9kaWcgLTQKZ3R4bnMgQW1vdW50CmZyYW1lX2RpZyAzCj09CmFzc2VydApmcmFtZV9kaWcgLTQKZ3R4bnMgUmVjZWl2ZXIKZ2xvYmFsIEN1cnJlbnRBcHBsaWNhdGlvbkFkZHJlc3MKPT0KYXNzZXJ0CnJldHN1YgoKLy8gdmVzdF90b2tlbnMKdmVzdHRva2Vuc18xNDoKcHJvdG8gNSAwCmludGNfMCAvLyAwCmR1cG4gMgpieXRlY18wIC8vICIiCmludGNfMCAvLyAwCmJ5dGVjXzAgLy8gIiIKaW50Y18wIC8vIDAKZHVwCmJ5dGVjXzAgLy8gIiIKZHVwCmludGNfMCAvLyAwCmR1cAp0eG4gU2VuZGVyCmNhbGxzdWIgYXV0aG9ubHlfNQovLyB1bmF1dGhvcml6ZWQKYXNzZXJ0CmZyYW1lX2RpZyAtNApndHhucyBYZmVyQXNzZXQKZnJhbWVfYnVyeSAwCmZyYW1lX2RpZyAtNApndHhucyBBc3NldEFtb3VudApmcmFtZV9idXJ5IDEKZnJhbWVfZGlnIC0yCmdsb2JhbCBMYXRlc3RUaW1lc3RhbXAKPj0KYXNzZXJ0CmZyYW1lX2RpZyAtMgpnbG9iYWwgTGF0ZXN0VGltZXN0YW1wCmJ5dGVjXzMgLy8gIm14cyIKYXBwX2dsb2JhbF9nZXQKKwo8PQphc3NlcnQKZnJhbWVfZGlnIC0xCmJ5dGVjIDQgLy8gIm1udGYiCmFwcF9nbG9iYWxfZ2V0Cj49CmFzc2VydApmcmFtZV9kaWcgLTEKYnl0ZWMgNSAvLyAibXh0ZiIKYXBwX2dsb2JhbF9nZXQKPD0KYXNzZXJ0CmZyYW1lX2RpZyAtMgpmcmFtZV9kaWcgLTEKKwpmcmFtZV9idXJ5IC0xCmludGNfMCAvLyAwCmZyYW1lX2J1cnkgMgpmcmFtZV9kaWcgLTMKZ2xvYmFsIFplcm9BZGRyZXNzCiE9CmFzc2VydApmcmFtZV9kaWcgLTMKbGVuCmludGNfMiAvLyAzMgo9PQphc3NlcnQKYnl0ZWNfMSAvLyAibWEiCmFwcF9nbG9iYWxfZ2V0CmZyYW1lX2J1cnkgMwpmcmFtZV9kaWcgMwpsZW4KaW50Y18yIC8vIDMyCj09CmFzc2VydAppbnRjXzAgLy8gMApmcmFtZV9idXJ5IDQKZnJhbWVfZGlnIC0yCml0b2IKZnJhbWVfZGlnIC0xCml0b2IKY29uY2F0CmZyYW1lX2RpZyAwCml0b2IKY29uY2F0CmZyYW1lX2RpZyAxCml0b2IKY29uY2F0CmZyYW1lX2RpZyAyCml0b2IKY29uY2F0CmZyYW1lX2RpZyAzCmNvbmNhdApieXRlY18yIC8vIDB4MDAKaW50Y18wIC8vIDAKZnJhbWVfZGlnIDQKc2V0Yml0CmNvbmNhdApmcmFtZV9idXJ5IDUKZ2xvYmFsIEN1cnJlbnRBcHBsaWNhdGlvbkFkZHJlc3MKbWluX2JhbGFuY2UKZnJhbWVfYnVyeSAxMApmcmFtZV9kaWcgLTMKYm94X2dldApzdG9yZSAzMwpzdG9yZSAzMgpsb2FkIDMzCiEKYXNzZXJ0CmZyYW1lX2RpZyAtMwpib3hfZGVsCnBvcApmcmFtZV9kaWcgLTMKZnJhbWVfZGlnIDUKYm94X3B1dApnbG9iYWwgQ3VycmVudEFwcGxpY2F0aW9uQWRkcmVzcwptaW5fYmFsYW5jZQpmcmFtZV9kaWcgMTAKLQpmcmFtZV9idXJ5IDExCmZyYW1lX2RpZyAtNQpndHhucyBBbW91bnQKZnJhbWVfZGlnIDExCj09CmFzc2VydApmcmFtZV9kaWcgLTUKZ3R4bnMgVHlwZUVudW0KaW50Y18xIC8vIHBheQo9PQphc3NlcnQKZnJhbWVfZGlnIC01Cmd0eG5zIFJlY2VpdmVyCmdsb2JhbCBDdXJyZW50QXBwbGljYXRpb25BZGRyZXNzCj09CmFzc2VydApmcmFtZV9kaWcgLTUKZ3R4bnMgQ2xvc2VSZW1haW5kZXJUbwpnbG9iYWwgWmVyb0FkZHJlc3MKPT0KYXNzZXJ0CmZyYW1lX2RpZyAtNQpndHhucyBSZWtleVRvCmdsb2JhbCBaZXJvQWRkcmVzcwo9PQphc3NlcnQKZnJhbWVfZGlnIC01Cmd0eG5zIExlYXNlCmdsb2JhbCBaZXJvQWRkcmVzcwo9PQphc3NlcnQKZnJhbWVfZGlnIC00Cmd0eG5zIFR5cGVFbnVtCmludGNfMyAvLyBheGZlcgo9PQphc3NlcnQKZnJhbWVfZGlnIC00Cmd0eG5zIEFzc2V0UmVjZWl2ZXIKZ2xvYmFsIEN1cnJlbnRBcHBsaWNhdGlvbkFkZHJlc3MKPT0KYXNzZXJ0CmZyYW1lX2RpZyAtNApndHhucyBBc3NldFNlbmRlcgpnbG9iYWwgWmVyb0FkZHJlc3MKPT0KYXNzZXJ0CmZyYW1lX2RpZyAtNApndHhucyBDbG9zZVJlbWFpbmRlclRvCmdsb2JhbCBaZXJvQWRkcmVzcwo9PQphc3NlcnQKZnJhbWVfZGlnIC00Cmd0eG5zIFJla2V5VG8KZ2xvYmFsIFplcm9BZGRyZXNzCj09CmFzc2VydApmcmFtZV9kaWcgLTQKZ3R4bnMgTGVhc2UKZ2xvYmFsIFplcm9BZGRyZXNzCj09CmFzc2VydApmcmFtZV9kaWcgLTQKZ3R4bnMgQXNzZXRDbG9zZVRvCmdsb2JhbCBaZXJvQWRkcmVzcwo9PQphc3NlcnQKcmV0c3ViCgovLyBjbGFpbV92ZXN0aW5nCmNsYWltdmVzdGluZ18xNToKcHJvdG8gMiAwCmJ5dGVjXzAgLy8gIiIKaW50Y18wIC8vIDAKZHVwbiA0CmJ5dGVjXzAgLy8gIiIKaW50Y18wIC8vIDAKZHVwbiA1CmJ5dGVjXzAgLy8gIiIKaW50Y18wIC8vIDAKZHVwCmJ5dGVjXzAgLy8gIiIKZHVwCmZyYW1lX2RpZyAtMgp0eG5hcyBBY2NvdW50cwpnbG9iYWwgWmVyb0FkZHJlc3MKIT0KYXNzZXJ0CmZyYW1lX2RpZyAtMgp0eG5hcyBBY2NvdW50cwpsZW4KaW50Y18yIC8vIDMyCj09CmFzc2VydApmcmFtZV9kaWcgLTIKdHhuYXMgQWNjb3VudHMKYm94X2dldApzdG9yZSAzNQpzdG9yZSAzNApsb2FkIDM1CmFzc2VydApmcmFtZV9kaWcgLTIKdHhuYXMgQWNjb3VudHMKYm94X2dldApzdG9yZSAzNwpzdG9yZSAzNgpsb2FkIDM3CmFzc2VydApsb2FkIDM2CmZyYW1lX2J1cnkgMApmcmFtZV9kaWcgMAppbnRjXzAgLy8gMApleHRyYWN0X3VpbnQ2NApmcmFtZV9idXJ5IDEKZnJhbWVfZGlnIDAKcHVzaGludCA4IC8vIDgKZXh0cmFjdF91aW50NjQKZnJhbWVfYnVyeSAyCmZyYW1lX2RpZyAwCmludGNfMiAvLyAzMgpleHRyYWN0X3VpbnQ2NApmcmFtZV9idXJ5IDMKZnJhbWVfZGlnIDAKcHVzaGludCAxNiAvLyAxNgpleHRyYWN0X3VpbnQ2NApmcmFtZV9idXJ5IDQKZnJhbWVfZGlnIDAKcHVzaGludCAyNCAvLyAyNApleHRyYWN0X3VpbnQ2NApmcmFtZV9idXJ5IDUKZnJhbWVfZGlnIDAKZXh0cmFjdCA0MCAzMgpmcmFtZV9idXJ5IDYKZnJhbWVfZGlnIDAKaW50YyA0IC8vIDU3NgpnZXRiaXQKZnJhbWVfYnVyeSA3Cmdsb2JhbCBMYXRlc3RUaW1lc3RhbXAKZnJhbWVfZGlnIDEKPj0KYXNzZXJ0CmZyYW1lX2RpZyA2Cmdsb2JhbCBaZXJvQWRkcmVzcwohPQphc3NlcnQKZnJhbWVfZGlnIDYKYnl0ZWNfMSAvLyAibWEiCmFwcF9nbG9iYWxfZ2V0Cj09CmFzc2VydApmcmFtZV9kaWcgNwppbnRjXzAgLy8gMAo9PQphc3NlcnQKaW50Y18wIC8vIDAKZnJhbWVfYnVyeSA4CmZyYW1lX2RpZyAyCmdsb2JhbCBMYXRlc3RUaW1lc3RhbXAKPgpibnogY2xhaW12ZXN0aW5nXzE1X2w1CmZyYW1lX2RpZyA1CmZyYW1lX2RpZyAzCi0KZnJhbWVfYnVyeSA4CmNsYWltdmVzdGluZ18xNV9sMjoKZnJhbWVfZGlnIDQKZnJhbWVfZGlnIC0yCnR4bmFzIEFjY291bnRzCmZyYW1lX2RpZyA4CmludGNfMCAvLyAwCmNhbGxzdWIgc2VuZGFzc2V0XzgKZnJhbWVfZGlnIDMKZnJhbWVfZGlnIDgKKwpmcmFtZV9kaWcgNQo9PQpibnogY2xhaW12ZXN0aW5nXzE1X2w0CmZyYW1lX2RpZyAzCmZyYW1lX2RpZyA4CisKZnJhbWVfYnVyeSAzCmZyYW1lX2RpZyAxCml0b2IKZnJhbWVfZGlnIDIKaXRvYgpjb25jYXQKZnJhbWVfZGlnIDQKaXRvYgpjb25jYXQKZnJhbWVfZGlnIDUKaXRvYgpjb25jYXQKZnJhbWVfZGlnIDMKaXRvYgpjb25jYXQKZnJhbWVfZGlnIDYKY29uY2F0CmJ5dGVjXzIgLy8gMHgwMAppbnRjXzAgLy8gMApmcmFtZV9kaWcgNwpzZXRiaXQKY29uY2F0CmZyYW1lX2J1cnkgMTMKZnJhbWVfZGlnIC0yCnR4bmFzIEFjY291bnRzCmJveF9kZWwKcG9wCmZyYW1lX2RpZyAtMgp0eG5hcyBBY2NvdW50cwpmcmFtZV9kaWcgMTMKYm94X3B1dApiIGNsYWltdmVzdGluZ18xNV9sNgpjbGFpbXZlc3RpbmdfMTVfbDQ6Cmdsb2JhbCBDdXJyZW50QXBwbGljYXRpb25BZGRyZXNzCm1pbl9iYWxhbmNlCmZyYW1lX2J1cnkgMTEKZnJhbWVfZGlnIC0yCnR4bmFzIEFjY291bnRzCmJveF9kZWwKcG9wCmZyYW1lX2RpZyAxMQpnbG9iYWwgQ3VycmVudEFwcGxpY2F0aW9uQWRkcmVzcwptaW5fYmFsYW5jZQotCmZyYW1lX2J1cnkgMTIKZnJhbWVfZGlnIDYKZnJhbWVfZGlnIDEyCmdsb2JhbCBNaW5UeG5GZWUKLQppbnRjXzAgLy8gMApjYWxsc3ViIHNlbmRhbGdvXzkKYiBjbGFpbXZlc3RpbmdfMTVfbDYKY2xhaW12ZXN0aW5nXzE1X2w1OgpmcmFtZV9kaWcgMgpmcmFtZV9kaWcgMQotCmZyYW1lX2J1cnkgOQpnbG9iYWwgTGF0ZXN0VGltZXN0YW1wCmZyYW1lX2RpZyAxCi0KZnJhbWVfYnVyeSAxMApmcmFtZV9kaWcgNQpmcmFtZV9kaWcgMTAKbXVsdwppbnRjXzAgLy8gMApmcmFtZV9kaWcgOQpkaXZtb2R3CnBvcApwb3AKc3dhcAohCmFzc2VydApmcmFtZV9kaWcgMwotCmZyYW1lX2J1cnkgOApiIGNsYWltdmVzdGluZ18xNV9sMgpjbGFpbXZlc3RpbmdfMTVfbDY6CnJldHN1YgoKLy8gc3Rha2VfdG9fZGVsZWdhdG9yCnN0YWtldG9kZWxlZ2F0b3JfMTY6CnByb3RvIDUgMAppbnRjXzAgLy8gMApieXRlY18wIC8vICIiCmludGNfMCAvLyAwCmR1cG4gNApieXRlY18wIC8vICIiCmludGNfMCAvLyAwCmJ5dGVjXzAgLy8gIiIKaW50Y18wIC8vIDAKZHVwCmJ5dGVjXzAgLy8gIiIKZHVwCmZyYW1lX2RpZyAtNAp0eG4gU2VuZGVyCj09CmFzc2VydApmcmFtZV9kaWcgLTUKdHhuYXMgQXBwbGljYXRpb25zCmFwcF9wYXJhbXNfZ2V0IEFwcEFkZHJlc3MKc3RvcmUgMzkKc3RvcmUgMzgKbG9hZCAzOQphc3NlcnQKZnJhbWVfZGlnIC01CnR4bmFzIEFwcGxpY2F0aW9ucwpmcmFtZV9idXJ5IDAKZnJhbWVfZGlnIDAKaXRvYgpib3hfZ2V0CnN0b3JlIDQxCnN0b3JlIDQwCmxvYWQgNDEKYXNzZXJ0CmZyYW1lX2RpZyAtNApib3hfZ2V0CnN0b3JlIDQzCnN0b3JlIDQyCmxvYWQgNDMKYXNzZXJ0CmxvYWQgNDIKZnJhbWVfYnVyeSAxCmZyYW1lX2RpZyAxCmludGNfMCAvLyAwCmV4dHJhY3RfdWludDY0CmZyYW1lX2J1cnkgMgpmcmFtZV9kaWcgMQpwdXNoaW50IDggLy8gOApleHRyYWN0X3VpbnQ2NApmcmFtZV9idXJ5IDMKZnJhbWVfZGlnIDEKcHVzaGludCAxNiAvLyAxNgpleHRyYWN0X3VpbnQ2NApmcmFtZV9idXJ5IDQKZnJhbWVfZGlnIDEKcHVzaGludCAyNCAvLyAyNApleHRyYWN0X3VpbnQ2NApmcmFtZV9idXJ5IDUKZnJhbWVfZGlnIDEKaW50Y18yIC8vIDMyCmV4dHJhY3RfdWludDY0CmZyYW1lX2J1cnkgNgpmcmFtZV9kaWcgMQpleHRyYWN0IDQwIDMyCmZyYW1lX2J1cnkgNwpmcmFtZV9kaWcgMQppbnRjIDQgLy8gNTc2CmdldGJpdApmcmFtZV9idXJ5IDgKZnJhbWVfZGlnIDcKZ2xvYmFsIFplcm9BZGRyZXNzCiE9CmFzc2VydApmcmFtZV9kaWcgOAppbnRjXzAgLy8gMAo9PQphc3NlcnQKaXR4bl9iZWdpbgppbnRjXzMgLy8gYXhmZXIKaXR4bl9maWVsZCBUeXBlRW51bQpmcmFtZV9kaWcgNQpmcmFtZV9kaWcgNgotCml0eG5fZmllbGQgQXNzZXRBbW91bnQKZnJhbWVfZGlnIDQKaXR4bl9maWVsZCBYZmVyQXNzZXQKbG9hZCAzOAppdHhuX2ZpZWxkIEFzc2V0UmVjZWl2ZXIKaXR4bl9uZXh0CnB1c2hpbnQgNiAvLyBhcHBsCml0eG5fZmllbGQgVHlwZUVudW0KZnJhbWVfZGlnIC01CnR4bmFzIEFwcGxpY2F0aW9ucwppdHhuX2ZpZWxkIEFwcGxpY2F0aW9uSUQKdHhuIFNlbmRlcgppdHhuX2ZpZWxkIEFjY291bnRzCmZyYW1lX2RpZyAtMQp0eG5hcyBBY2NvdW50cwppdHhuX2ZpZWxkIEFjY291bnRzCmZyYW1lX2RpZyAtMwp0eG5hcyBBcHBsaWNhdGlvbnMKaXR4bl9maWVsZCBBcHBsaWNhdGlvbnMKZnJhbWVfZGlnIC0yCnR4bmFzIEFzc2V0cwppdHhuX2ZpZWxkIEFzc2V0cwpwdXNoYnl0ZXMgMHgyMzBiOGNhNCAvLyAic3Rha2UoYXhmZXIsYWNjb3VudCxhcHBsaWNhdGlvbixhc3NldCxhY2NvdW50KXZvaWQiCml0eG5fZmllbGQgQXBwbGljYXRpb25BcmdzCmJ5dGVjIDYgLy8gMHgwMQppdHhuX2ZpZWxkIEFwcGxpY2F0aW9uQXJncwpieXRlYyA2IC8vIDB4MDEKaXR4bl9maWVsZCBBcHBsaWNhdGlvbkFyZ3MKYnl0ZWNfMiAvLyAweDAwCml0eG5fZmllbGQgQXBwbGljYXRpb25BcmdzCmJ5dGVjIDcgLy8gMHgwMgppdHhuX2ZpZWxkIEFwcGxpY2F0aW9uQXJncwppbnRjXzAgLy8gMAppdHhuX2ZpZWxkIEZlZQppdHhuX3N1Ym1pdAppbnRjXzEgLy8gMQpmcmFtZV9idXJ5IDgKZnJhbWVfZGlnIDIKaXRvYgpmcmFtZV9kaWcgMwppdG9iCmNvbmNhdApmcmFtZV9kaWcgNAppdG9iCmNvbmNhdApmcmFtZV9kaWcgNQppdG9iCmNvbmNhdApmcmFtZV9kaWcgNgppdG9iCmNvbmNhdApmcmFtZV9kaWcgNwpjb25jYXQKYnl0ZWNfMiAvLyAweDAwCmludGNfMCAvLyAwCmZyYW1lX2RpZyA4CnNldGJpdApjb25jYXQKZnJhbWVfYnVyeSA5CmZyYW1lX2RpZyAtNApib3hfZGVsCnBvcApmcmFtZV9kaWcgLTQKZnJhbWVfZGlnIDkKYm94X3B1dApyZXRzdWIKCi8vIHdpdGhkcmF3X2Zyb21fZGVsZWdhdG9yCndpdGhkcmF3ZnJvbWRlbGVnYXRvcl8xNzoKcHJvdG8gNSAwCmJ5dGVjXzAgLy8gIiIKaW50Y18wIC8vIDAKZHVwbiA0CmJ5dGVjXzAgLy8gIiIKaW50Y18wIC8vIDAKYnl0ZWNfMCAvLyAiIgppbnRjXzAgLy8gMApkdXAKYnl0ZWNfMCAvLyAiIgpkdXAKZnJhbWVfZGlnIC00CnR4biBTZW5kZXIKPT0KYXNzZXJ0CmZyYW1lX2RpZyAtNApib3hfZ2V0CnN0b3JlIDQ1CnN0b3JlIDQ0CmxvYWQgNDUKYXNzZXJ0CmxvYWQgNDQKZnJhbWVfYnVyeSAwCmZyYW1lX2RpZyAwCmludGNfMCAvLyAwCmV4dHJhY3RfdWludDY0CmZyYW1lX2J1cnkgMQpmcmFtZV9kaWcgMApwdXNoaW50IDggLy8gOApleHRyYWN0X3VpbnQ2NApmcmFtZV9idXJ5IDIKZnJhbWVfZGlnIDAKcHVzaGludCAxNiAvLyAxNgpleHRyYWN0X3VpbnQ2NApmcmFtZV9idXJ5IDMKZnJhbWVfZGlnIDAKcHVzaGludCAyNCAvLyAyNApleHRyYWN0X3VpbnQ2NApmcmFtZV9idXJ5IDQKZnJhbWVfZGlnIDAKaW50Y18yIC8vIDMyCmV4dHJhY3RfdWludDY0CmZyYW1lX2J1cnkgNQpmcmFtZV9kaWcgMApleHRyYWN0IDQwIDMyCmZyYW1lX2J1cnkgNgpmcmFtZV9kaWcgMAppbnRjIDQgLy8gNTc2CmdldGJpdApmcmFtZV9idXJ5IDcKZnJhbWVfZGlnIDYKZ2xvYmFsIFplcm9BZGRyZXNzCiE9CmFzc2VydApmcmFtZV9kaWcgNwppbnRjXzEgLy8gMQo9PQphc3NlcnQKaXR4bl9iZWdpbgpwdXNoaW50IDYgLy8gYXBwbAppdHhuX2ZpZWxkIFR5cGVFbnVtCmZyYW1lX2RpZyAtNQp0eG5hcyBBcHBsaWNhdGlvbnMKaXR4bl9maWVsZCBBcHBsaWNhdGlvbklECnR4biBTZW5kZXIKaXR4bl9maWVsZCBBY2NvdW50cwpmcmFtZV9kaWcgLTEKdHhuYXMgQWNjb3VudHMKaXR4bl9maWVsZCBBY2NvdW50cwpmcmFtZV9kaWcgLTMKdHhuYXMgQXBwbGljYXRpb25zCml0eG5fZmllbGQgQXBwbGljYXRpb25zCmZyYW1lX2RpZyAtMgp0eG5hcyBBc3NldHMKaXR4bl9maWVsZCBBc3NldHMKcHVzaGJ5dGVzIDB4ZDBjMjZlYWMgLy8gIndpdGhkcmF3X25vbl9zdGFrZShhY2NvdW50LGFzc2V0LGFwcGxpY2F0aW9uLGFjY291bnQpdm9pZCIKaXR4bl9maWVsZCBBcHBsaWNhdGlvbkFyZ3MKYnl0ZWMgNiAvLyAweDAxCml0eG5fZmllbGQgQXBwbGljYXRpb25BcmdzCmJ5dGVjXzIgLy8gMHgwMAppdHhuX2ZpZWxkIEFwcGxpY2F0aW9uQXJncwpieXRlYyA2IC8vIDB4MDEKaXR4bl9maWVsZCBBcHBsaWNhdGlvbkFyZ3MKYnl0ZWMgNyAvLyAweDAyCml0eG5fZmllbGQgQXBwbGljYXRpb25BcmdzCmludGNfMCAvLyAwCml0eG5fZmllbGQgRmVlCml0eG5fc3VibWl0CmludGNfMCAvLyAwCmZyYW1lX2J1cnkgNwpmcmFtZV9kaWcgMQppdG9iCmZyYW1lX2RpZyAyCml0b2IKY29uY2F0CmZyYW1lX2RpZyAzCml0b2IKY29uY2F0CmZyYW1lX2RpZyA0Cml0b2IKY29uY2F0CmZyYW1lX2RpZyA1Cml0b2IKY29uY2F0CmZyYW1lX2RpZyA2CmNvbmNhdApieXRlY18yIC8vIDB4MDAKaW50Y18wIC8vIDAKZnJhbWVfZGlnIDcKc2V0Yml0CmNvbmNhdApmcmFtZV9idXJ5IDgKZnJhbWVfZGlnIC00CmJveF9kZWwKcG9wCmZyYW1lX2RpZyAtNApmcmFtZV9kaWcgOApib3hfcHV0CnJldHN1YgoKLy8gYWRkX3doaXRlbGlzdGVkX2FwcAphZGR3aGl0ZWxpc3RlZGFwcF8xODoKcHJvdG8gMiAwCmludGNfMCAvLyAwCmR1cG4gMgp0eG4gU2VuZGVyCmNhbGxzdWIgYXV0aG9ubHlfNgovLyB1bmF1dGhvcml6ZWQKYXNzZXJ0Cmdsb2JhbCBDdXJyZW50QXBwbGljYXRpb25BZGRyZXNzCm1pbl9iYWxhbmNlCmZyYW1lX2J1cnkgMApmcmFtZV9kaWcgLTEKdHhuYXMgQXBwbGljYXRpb25zCmZyYW1lX2J1cnkgMQpmcmFtZV9kaWcgMQppdG9iCmJ5dGVjXzAgLy8gIiIKYm94X3B1dApnbG9iYWwgQ3VycmVudEFwcGxpY2F0aW9uQWRkcmVzcwptaW5fYmFsYW5jZQpmcmFtZV9kaWcgMAotCmZyYW1lX2J1cnkgMgpmcmFtZV9kaWcgLTIKZ3R4bnMgUmVjZWl2ZXIKZ2xvYmFsIEN1cnJlbnRBcHBsaWNhdGlvbkFkZHJlc3MKPT0KYXNzZXJ0CmZyYW1lX2RpZyAtMgpndHhucyBBbW91bnQKZnJhbWVfZGlnIDIKPT0KYXNzZXJ0CnJldHN1YgoKLy8gcmVtb3ZlX3doaXRlbGlzdGVkX2FwcApyZW1vdmV3aGl0ZWxpc3RlZGFwcF8xOToKcHJvdG8gMSAwCmludGNfMCAvLyAwCmR1cG4gMgp0eG4gU2VuZGVyCmNhbGxzdWIgYXV0aG9ubHlfNwovLyB1bmF1dGhvcml6ZWQKYXNzZXJ0Cmdsb2JhbCBDdXJyZW50QXBwbGljYXRpb25BZGRyZXNzCm1pbl9iYWxhbmNlCmZyYW1lX2J1cnkgMApmcmFtZV9kaWcgLTEKdHhuYXMgQXBwbGljYXRpb25zCmZyYW1lX2J1cnkgMQpmcmFtZV9kaWcgMQppdG9iCmJveF9nZXQKc3RvcmUgNDcKc3RvcmUgNDYKbG9hZCA0Nwphc3NlcnQKZnJhbWVfZGlnIDEKaXRvYgpib3hfZGVsCmFzc2VydApmcmFtZV9kaWcgMApnbG9iYWwgQ3VycmVudEFwcGxpY2F0aW9uQWRkcmVzcwptaW5fYmFsYW5jZQotCmZyYW1lX2J1cnkgMgpieXRlY18xIC8vICJtYSIKYXBwX2dsb2JhbF9nZXQKZnJhbWVfZGlnIDIKaW50Y18wIC8vIDAKY2FsbHN1YiBzZW5kYWxnb185CnJldHN1Yg==";
    override clearProgram: string = "I3ByYWdtYSB2ZXJzaW9uIDgKcHVzaGludCAwIC8vIDAKcmV0dXJu";
    override methods: algosdk.ABIMethod[] = [
        new algosdk.ABIMethod({ name: "create", desc: "", args: [{ type: "address", name: "manager_address", desc: "" }, { type: "uint64", name: "max_start", desc: "" }, { type: "uint64", name: "min_timeframe", desc: "" }, { type: "uint64", name: "max_timeframe", desc: "" }], returns: { type: "void", desc: "" } }),
        new algosdk.ABIMethod({ name: "update_time_constraints", desc: "", args: [{ type: "uint64", name: "max_start", desc: "" }, { type: "uint64", name: "min_timeframe", desc: "" }, { type: "uint64", name: "max_timeframe", desc: "" }], returns: { type: "void", desc: "" } }),
        new algosdk.ABIMethod({ name: "update_manager_address", desc: "", args: [{ type: "address", name: "new_manager_address", desc: "" }], returns: { type: "void", desc: "" } }),
        new algosdk.ABIMethod({ name: "optin_asset", desc: "", args: [{ type: "pay", name: "algo_xfer", desc: "" }, { type: "asset", name: "asset", desc: "" }, { type: "application", name: "main_app_id", desc: "" }, { type: "address", name: "main_app_addr", desc: "" }], returns: { type: "void", desc: "" } }),
        new algosdk.ABIMethod({ name: "vest_tokens", desc: "", args: [{ type: "pay", name: "algo_xfer", desc: "" }, { type: "axfer", name: "token_xfer", desc: "" }, { type: "address", name: "vest_to", desc: "" }, { type: "uint64", name: "start_time", desc: "" }, { type: "uint64", name: "time_to_vest", desc: "" }], returns: { type: "void", desc: "" } }),
        new algosdk.ABIMethod({ name: "claim_vesting", desc: "", args: [{ type: "account", name: "vestee", desc: "" }, { type: "asset", name: "asset_ref", desc: "" }], returns: { type: "void", desc: "" } }),
        new algosdk.ABIMethod({ name: "stake_to_delegator", desc: "", args: [{ type: "application", name: "delegator", desc: "" }, { type: "address", name: "vestee", desc: "" }, { type: "application", name: "main_app_ref", desc: "" }, { type: "asset", name: "asset_reference", desc: "" }, { type: "account", name: "manager_reference", desc: "" }], returns: { type: "void", desc: "" } }),
        new algosdk.ABIMethod({ name: "withdraw_from_delegator", desc: "", args: [{ type: "application", name: "delegator", desc: "" }, { type: "address", name: "vestee", desc: "" }, { type: "application", name: "main_app_ref", desc: "" }, { type: "asset", name: "asset_reference", desc: "" }, { type: "account", name: "manager_reference", desc: "" }], returns: { type: "void", desc: "" } }),
        new algosdk.ABIMethod({ name: "add_whitelisted_app", desc: "", args: [{ type: "pay", name: "algo_xfer", desc: "" }, { type: "application", name: "app_id", desc: "" }], returns: { type: "void", desc: "" } }),
        new algosdk.ABIMethod({ name: "remove_whitelisted_app", desc: "", args: [{ type: "application", name: "app_id", desc: "" }], returns: { type: "void", desc: "" } })
    ];
    async create(args: {
        manager_address: string;
        max_start: bigint;
        min_timeframe: bigint;
        max_timeframe: bigint;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
        const result = await this._execute(await this.compose.create({ manager_address: args.manager_address, max_start: args.max_start, min_timeframe: args.min_timeframe, max_timeframe: args.max_timeframe }, txnParams));
        return new bkr.ABIResult<void>(result);
    }
    async update_time_constraints(args: {
        max_start: bigint;
        min_timeframe: bigint;
        max_timeframe: bigint;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
        const result = await this._execute(await this.compose.update_time_constraints({ max_start: args.max_start, min_timeframe: args.min_timeframe, max_timeframe: args.max_timeframe }, txnParams));
        return new bkr.ABIResult<void>(result);
    }
    async update_manager_address(args: {
        new_manager_address: string;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
        const result = await this._execute(await this.compose.update_manager_address({ new_manager_address: args.new_manager_address }, txnParams));
        return new bkr.ABIResult<void>(result);
    }
    async optin_asset(args: {
        algo_xfer: algosdk.TransactionWithSigner | algosdk.Transaction;
        asset: bigint;
        main_app_id: bigint;
        main_app_addr: string;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
        const result = await this._execute(await this.compose.optin_asset({ algo_xfer: args.algo_xfer, asset: args.asset, main_app_id: args.main_app_id, main_app_addr: args.main_app_addr }, txnParams));
        return new bkr.ABIResult<void>(result);
    }
    async vest_tokens(args: {
        algo_xfer: algosdk.TransactionWithSigner | algosdk.Transaction;
        token_xfer: algosdk.TransactionWithSigner | algosdk.Transaction;
        vest_to: string;
        start_time: bigint;
        time_to_vest: bigint;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
        const result = await this._execute(await this.compose.vest_tokens({ algo_xfer: args.algo_xfer, token_xfer: args.token_xfer, vest_to: args.vest_to, start_time: args.start_time, time_to_vest: args.time_to_vest }, txnParams));
        return new bkr.ABIResult<void>(result);
    }
    async claim_vesting(args: {
        vestee: string;
        asset_ref: bigint;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
        const result = await this._execute(await this.compose.claim_vesting({ vestee: args.vestee, asset_ref: args.asset_ref }, txnParams));
        return new bkr.ABIResult<void>(result);
    }
    async stake_to_delegator(args: {
        delegator: bigint;
        vestee: string;
        main_app_ref: bigint;
        asset_reference: bigint;
        manager_reference: string;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
        const result = await this._execute(await this.compose.stake_to_delegator({ delegator: args.delegator, vestee: args.vestee, main_app_ref: args.main_app_ref, asset_reference: args.asset_reference, manager_reference: args.manager_reference }, txnParams));
        return new bkr.ABIResult<void>(result);
    }
    async withdraw_from_delegator(args: {
        delegator: bigint;
        vestee: string;
        main_app_ref: bigint;
        asset_reference: bigint;
        manager_reference: string;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
        const result = await this._execute(await this.compose.withdraw_from_delegator({ delegator: args.delegator, vestee: args.vestee, main_app_ref: args.main_app_ref, asset_reference: args.asset_reference, manager_reference: args.manager_reference }, txnParams));
        return new bkr.ABIResult<void>(result);
    }
    async add_whitelisted_app(args: {
        algo_xfer: algosdk.TransactionWithSigner | algosdk.Transaction;
        app_id: bigint;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
        const result = await this._execute(await this.compose.add_whitelisted_app({ algo_xfer: args.algo_xfer, app_id: args.app_id }, txnParams));
        return new bkr.ABIResult<void>(result);
    }
    async remove_whitelisted_app(args: {
        app_id: bigint;
    }, txnParams?: bkr.TransactionOverrides): Promise<bkr.ABIResult<void>> {
        const result = await this._execute(await this.compose.remove_whitelisted_app({ app_id: args.app_id }, txnParams));
        return new bkr.ABIResult<void>(result);
    }
    compose = {
        create: async (args: {
            manager_address: string;
            max_start: bigint;
            min_timeframe: bigint;
            max_timeframe: bigint;
        }, txnParams?: bkr.TransactionOverrides, atc?: algosdk.AtomicTransactionComposer): Promise<algosdk.AtomicTransactionComposer> => {
            return this._addMethodCall(algosdk.getMethodByName(this.methods, "create"), { manager_address: args.manager_address, max_start: args.max_start, min_timeframe: args.min_timeframe, max_timeframe: args.max_timeframe }, txnParams, atc);
        },
        update_time_constraints: async (args: {
            max_start: bigint;
            min_timeframe: bigint;
            max_timeframe: bigint;
        }, txnParams?: bkr.TransactionOverrides, atc?: algosdk.AtomicTransactionComposer): Promise<algosdk.AtomicTransactionComposer> => {
            return this._addMethodCall(algosdk.getMethodByName(this.methods, "update_time_constraints"), { max_start: args.max_start, min_timeframe: args.min_timeframe, max_timeframe: args.max_timeframe }, txnParams, atc);
        },
        update_manager_address: async (args: {
            new_manager_address: string;
        }, txnParams?: bkr.TransactionOverrides, atc?: algosdk.AtomicTransactionComposer): Promise<algosdk.AtomicTransactionComposer> => {
            return this._addMethodCall(algosdk.getMethodByName(this.methods, "update_manager_address"), { new_manager_address: args.new_manager_address }, txnParams, atc);
        },
        optin_asset: async (args: {
            algo_xfer: algosdk.TransactionWithSigner | algosdk.Transaction;
            asset: bigint;
            main_app_id: bigint;
            main_app_addr: string;
        }, txnParams?: bkr.TransactionOverrides, atc?: algosdk.AtomicTransactionComposer): Promise<algosdk.AtomicTransactionComposer> => {
            return this._addMethodCall(algosdk.getMethodByName(this.methods, "optin_asset"), { algo_xfer: args.algo_xfer, asset: args.asset, main_app_id: args.main_app_id, main_app_addr: args.main_app_addr }, txnParams, atc);
        },
        vest_tokens: async (args: {
            algo_xfer: algosdk.TransactionWithSigner | algosdk.Transaction;
            token_xfer: algosdk.TransactionWithSigner | algosdk.Transaction;
            vest_to: string;
            start_time: bigint;
            time_to_vest: bigint;
        }, txnParams?: bkr.TransactionOverrides, atc?: algosdk.AtomicTransactionComposer): Promise<algosdk.AtomicTransactionComposer> => {
            return this._addMethodCall(algosdk.getMethodByName(this.methods, "vest_tokens"), { algo_xfer: args.algo_xfer, token_xfer: args.token_xfer, vest_to: args.vest_to, start_time: args.start_time, time_to_vest: args.time_to_vest }, txnParams, atc);
        },
        claim_vesting: async (args: {
            vestee: string;
            asset_ref: bigint;
        }, txnParams?: bkr.TransactionOverrides, atc?: algosdk.AtomicTransactionComposer): Promise<algosdk.AtomicTransactionComposer> => {
            return this._addMethodCall(algosdk.getMethodByName(this.methods, "claim_vesting"), { vestee: args.vestee, asset_ref: args.asset_ref }, txnParams, atc);
        },
        stake_to_delegator: async (args: {
            delegator: bigint;
            vestee: string;
            main_app_ref: bigint;
            asset_reference: bigint;
            manager_reference: string;
        }, txnParams?: bkr.TransactionOverrides, atc?: algosdk.AtomicTransactionComposer): Promise<algosdk.AtomicTransactionComposer> => {
            return this._addMethodCall(algosdk.getMethodByName(this.methods, "stake_to_delegator"), { delegator: args.delegator, vestee: args.vestee, main_app_ref: args.main_app_ref, asset_reference: args.asset_reference, manager_reference: args.manager_reference }, txnParams, atc);
        },
        withdraw_from_delegator: async (args: {
            delegator: bigint;
            vestee: string;
            main_app_ref: bigint;
            asset_reference: bigint;
            manager_reference: string;
        }, txnParams?: bkr.TransactionOverrides, atc?: algosdk.AtomicTransactionComposer): Promise<algosdk.AtomicTransactionComposer> => {
            return this._addMethodCall(algosdk.getMethodByName(this.methods, "withdraw_from_delegator"), { delegator: args.delegator, vestee: args.vestee, main_app_ref: args.main_app_ref, asset_reference: args.asset_reference, manager_reference: args.manager_reference }, txnParams, atc);
        },
        add_whitelisted_app: async (args: {
            algo_xfer: algosdk.TransactionWithSigner | algosdk.Transaction;
            app_id: bigint;
        }, txnParams?: bkr.TransactionOverrides, atc?: algosdk.AtomicTransactionComposer): Promise<algosdk.AtomicTransactionComposer> => {
            return this._addMethodCall(algosdk.getMethodByName(this.methods, "add_whitelisted_app"), { algo_xfer: args.algo_xfer, app_id: args.app_id }, txnParams, atc);
        },
        remove_whitelisted_app: async (args: {
            app_id: bigint;
        }, txnParams?: bkr.TransactionOverrides, atc?: algosdk.AtomicTransactionComposer): Promise<algosdk.AtomicTransactionComposer> => {
            return this._addMethodCall(algosdk.getMethodByName(this.methods, "remove_whitelisted_app"), { app_id: args.app_id }, txnParams, atc);
        }
    };
}
