    function DateTimeInput(props) {
      var value = props.value || "";
      var onChange = props.onChange;
      
      var datePart = "";
      var timePart = "";
      if (value) {
         var parts = value.split("T");
         datePart = parts[0];
         timePart = parts[1] || "00:00";
      }
      
      var hour24 = timePart ? parseInt(timePart.split(":")[0]) : 12;
      if (isNaN(hour24)) hour24 = 12;
      
      var minuteVal = timePart ? parseInt(timePart.split(":")[1]) : 0;
      if (isNaN(minuteVal)) minuteVal = 0;
      
      var ampm = hour24 >= 12 ? "PM" : "AM";
      var hour12 = hour24 % 12;
      if (hour12 === 0) hour12 = 12;
      
      function update(d, h12, m, ap) {
          if (!d) {
              onChange(""); 
              return;
          }
          var h24 = parseInt(h12);
          if (ap === "PM" && h24 < 12) h24 += 12;
          if (ap === "AM" && h24 === 12) h24 = 0;
          
          var hStr = String(h24).padStart(2, '0');
          var mStr = String(m).padStart(2, '0');
          
          onChange(d + "T" + hStr + ":" + mStr);
      }
      
      return e("div", { style: { display: "flex", gap: 8, alignItems: "center" } },
          e("input", {
              type: "date",
              value: datePart,
              onChange: function(ev) { update(ev.target.value, hour12, minuteVal, ampm); },
              style: { flex: 2, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }
          }),
          e("div", { style: { display: "flex", gap: 4, flex: 3 } },
              e("select", {
                  value: hour12,
                  onChange: function(ev) { update(datePart, ev.target.value, minuteVal, ampm); },
                  style: { flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }
              }, 
                [1,2,3,4,5,6,7,8,9,10,11,12].map(function(h) { return e("option", { key: h, value: h }, h); })
              ),
              e("input", {
                  type: "number",
                  min: 0,
                  max: 59,
                  value: minuteVal,
                  onChange: function(ev) { update(datePart, hour12, ev.target.value, ampm); },
                  style: { flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }
              }),
               e("select", {
                  value: ampm,
                  onChange: function(ev) { update(datePart, hour12, minuteVal, ev.target.value); },
                  style: { flex: 1, padding: 8, borderRadius: 6, border: "1px solid #d1d5db" }
              },
                  e("option", { value: "AM" }, "AM"),
                  e("option", { value: "PM" }, "PM")
              )
          )
      );
    }
